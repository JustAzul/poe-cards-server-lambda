import 'reflect-metadata';
import { DIContainer } from '@/infra/di/container';
import { CardConfigurationService } from '@/application/services/card-configuration.service';
import FetchDivinationCardRewardsUseCase, { CardRewardResult } from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import ParseCardRewardUseCase from '@/application/use-cases/parse-card-reward.use-case';
import { ItemClass } from '@/domain/entities/item-class.enum';

describe('CardConfigurationService', () => {
  let service: CardConfigurationService;
  let container: DIContainer;
  let mockFetchDivinationCardRewardsUseCase: jest.Mocked<FetchDivinationCardRewardsUseCase>;
  let mockParseCardRewardUseCase: jest.Mocked<ParseCardRewardUseCase>;

  beforeEach(() => {
    // Get DI container instance
    container = DIContainer.getInstance();
    container.clear();

    // Create mocks
    mockFetchDivinationCardRewardsUseCase = {
      execute: jest.fn(),
    } as any;

    mockParseCardRewardUseCase = {
      execute: jest.fn(),
    } as any;

    // Register mocks
    container.registerMock('FetchDivinationCardRewardsUseCase', mockFetchDivinationCardRewardsUseCase);
    container.registerMock('ParseCardRewardUseCase', mockParseCardRewardUseCase);

    // Get service instance
    service = container.resolve<CardConfigurationService>('CardConfigurationService');
  });

  afterEach(() => {
    container.clear();
  });

  describe('buildConfiguration', () => {
    it('should return dynamic card configuration for a league', async () => {
      // Arrange
      const league = 'Standard';
      const mockCardRewards: CardRewardResult[] = [
        {
          cardName: 'The Doctor',
          reward: {
            name: 'Headhunter',
            type: 'uniqueitem',
            corrupted: false,
            quantity: 1,
          },
        },
        {
          cardName: 'The Wrath',
          reward: {
            name: 'Chaos Orb',
            type: 'currencyitem',
            corrupted: false,
            quantity: 10,
          },
        },
      ];

      mockFetchDivinationCardRewardsUseCase.execute.mockResolvedValue(mockCardRewards);
      mockParseCardRewardUseCase.execute
        .mockReturnValueOnce({
          cardName: 'The Doctor',
          corrupted: false,
          gemLevel: 0,
          itemClass: ItemClass.Unique,
          links: 0,
          rewardName: 'Headhunter',
        })
        .mockReturnValueOnce({
          cardName: 'The Wrath',
          amount: 10,
          rewardName: 'Chaos Orb',
        });

      // Act
      const result = await service.buildConfiguration(league);

      // Assert
      expect(mockFetchDivinationCardRewardsUseCase.execute).toHaveBeenCalledWith(league);
      expect(mockParseCardRewardUseCase.execute).toHaveBeenCalledTimes(2);
      
      expect(result).toEqual({
        cards: [
          {
            cardName: 'The Doctor',
            corrupted: false,
            gemLevel: 0,
            itemClass: ItemClass.Unique,
            links: 0,
            rewardName: 'Headhunter',
          },
        ],
        currencyCards: [
          {
            cardName: 'The Wrath',
            amount: 10,
            rewardName: 'Chaos Orb',
          },
        ],
      });
    });

    it('should handle errors gracefully when card parsing fails', async () => {
      // Arrange
      const league = 'Standard';
      const mockCardRewards: CardRewardResult[] = [
        {
          cardName: 'Invalid Card',
          reward: {
            name: 'Unknown Item',
            type: 'unknown',
            corrupted: false,
            quantity: 1,
          },
        },
      ];

      mockFetchDivinationCardRewardsUseCase.execute.mockResolvedValue(mockCardRewards);
      mockParseCardRewardUseCase.execute.mockImplementation(() => {
        throw new Error('Invalid reward type');
      });

      // Act
      const result = await service.buildConfiguration(league);

      // Assert
      expect(result).toEqual({
        cards: [],
        currencyCards: [],
      });
    });

    it('should separate unique item cards from currency cards correctly', async () => {
      // Arrange
      const league = 'Hardcore';
      const mockCardRewards: CardRewardResult[] = [
        {
          cardName: 'The Fiend',
          reward: {
            name: 'Headhunter',
            type: 'uniqueitem',
            corrupted: true,
            quantity: 1,
          },
        },
        {
          cardName: "The Dragon's Heart",
          reward: {
            name: 'Empower Support',
            type: 'gemitem',
            corrupted: true,
            level: 4,
            quantity: 1,
          },
        },
        {
          cardName: 'Abandoned Wealth',
          reward: {
            name: 'Exalted Orb',
            type: 'currencyitem',
            corrupted: false,
            quantity: 3,
          },
        },
      ];

      mockFetchDivinationCardRewardsUseCase.execute.mockResolvedValue(mockCardRewards);
      mockParseCardRewardUseCase.execute
        .mockReturnValueOnce({
          cardName: 'The Fiend',
          corrupted: true,
          gemLevel: 0,
          itemClass: ItemClass.Unique,
          links: 0,
          rewardName: 'Headhunter',
        })
        .mockReturnValueOnce({
          cardName: "The Dragon's Heart",
          corrupted: true,
          gemLevel: 4,
          itemClass: ItemClass.Gem,
          links: 0,
          rewardName: 'Empower Support',
        })
        .mockReturnValueOnce({
          cardName: 'Abandoned Wealth',
          amount: 3,
          rewardName: 'Exalted Orb',
        });

      // Act
      const result = await service.buildConfiguration(league);

      // Assert
      expect(result.cards).toHaveLength(2);
      expect(result.currencyCards).toHaveLength(1);
      expect(result.cards[0].itemClass).toBe(ItemClass.Unique);
      expect(result.cards[1].itemClass).toBe(ItemClass.Gem);
      expect(result.currencyCards[0].amount).toBe(3);
    });
  });
}); 