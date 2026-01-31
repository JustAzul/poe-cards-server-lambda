import { ICardMatcher, LeagueData } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { ItemCard, CurrencyCard, Card } from '@domain/entities/card.entity';
import { ProfitCalculationService } from '../profit-calculation.service';

describe('ProfitCalculationService', () => {
  let service: ProfitCalculationService;
  let mockCardMatcher: jest.Mocked<ICardMatcher>;
  let leagueData: LeagueData;

  beforeEach(() => {
    mockCardMatcher = {
      matchCard: jest.fn(),
      matchReward: jest.fn(),
    };
    service = new ProfitCalculationService(mockCardMatcher);
    leagueData = { items: [], currency: [] };
  });

  describe('calculateCardProfit', () => {
    describe('item cards', () => {
      it('should calculate profit for valid item card', () => {
        const leagueData: LeagueData = { items: [], currency: [] };

        const cardOverview: ItemOverview = {
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
          artFilename: 'doctor.png',
          flavourText: 'You are the Disease',
        };

        const rewardOverview: ItemOverview = {
          name: 'Headhunter',
          itemClass: 2,
          chaosValue: 5000,
          count: 20,
        };

        const card: ItemCard = {
          type: 'item',
          name: 'The Doctor',
          reward: 'Headhunter',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(mockCardMatcher.matchCard).toHaveBeenCalledWith(leagueData.items, card.name);
        expect(mockCardMatcher.matchReward).toHaveBeenCalledWith(
          leagueData.items,
          leagueData.currency,
          card,
        );
        expect(result).toBeDefined();
        expect(result?.Card.name).toBe('The Doctor');
        expect(result?.Card.stack).toBe(8);
        expect(result?.Card.chaosPrice).toBe(500);
        expect(result?.reward.name).toBe('Headhunter');
        expect(result?.reward.chaosPrice).toBe(5000);
        expect(result?.setChaosPrice).toBe(4000); // 8 * 500
        expect(result?.chaosProfit).toBe(1000); // 5000 - 4000
        expect(result?.isCurrency).toBe(false);
      });

      it('should format gem rewards with level', () => {
        const cardOverview: ItemOverview = {
          name: 'The Wretched',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        };

        const rewardOverview: ItemOverview = {
          name: 'Awakened Added Fire Damage Support',
          itemClass: 4, // Gem class
          chaosValue: 200,
          count: 30,
          gemLevel: 5,
        };

        const card: ItemCard = {
          type: 'item',
          name: 'The Wretched',
          reward: 'Awakened Added Fire Damage Support',
          rewardSpec: {
            iClass: 4,
            corrupted: false,
            links: 0,
            gemLevel: 5,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result?.reward.name).toBe('Level 5 Awakened Added Fire Damage Support');
      });

      it('should return null when card count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const rewardOverview: ItemOverview = {
          name: 'Test Item',
          itemClass: 2,
          chaosValue: 500,
          count: 20,
        };

        const card: ItemCard = {
          type: 'item',
          name: 'Test Card',
          reward: 'Test Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 20,
        };

        const rewardOverview: ItemOverview = {
          name: 'Test Item',
          itemClass: 2,
          chaosValue: 500,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const card: ItemCard = {
          type: 'item',
          name: 'Test Card',
          reward: 'Test Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when card not found', () => {
        const card: ItemCard = {
          type: 'item',
          name: 'Missing Card',
          reward: 'Test Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(null);
        mockCardMatcher.matchReward.mockReturnValue(null);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward not found', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 20,
        };

        const card: ItemCard = {
          type: 'item',
          name: 'Test Card',
          reward: 'Missing Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(null);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });
    });

    describe('currency cards', () => {
      it('should calculate profit for valid currency card', () => {
        const cardOverview: ItemOverview = {
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 2,
          count: 200,
          stackSize: 12,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: {
            count: 50,
          },
        };

        const card: CurrencyCard = {
          type: 'currency',
          name: 'The Hoarder',
          reward: 'Exalted Orb',
          rewardSpec: {
            amount: 1,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.Card.name).toBe('The Hoarder');
        expect(result?.reward.name).toBe('Exalted Orb');
        expect(result?.reward.chaosPrice).toBe(150);
        expect(result?.setChaosPrice).toBe(24); // 12 * 2
        expect(result?.chaosProfit).toBe(126); // 150 - 24
        expect(result?.isCurrency).toBe(true);
      });

      it('should format multiple currency rewards', () => {
        const cardOverview: ItemOverview = {
          name: 'Three Faces in the Dark',
          itemClass: 6,
          chaosValue: 0.3,
          count: 500,
          stackSize: 1,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        };

        const card: CurrencyCard = {
          type: 'currency',
          name: 'Three Faces in the Dark',
          reward: 'Chaos Orb',
          rewardSpec: {
            amount: 3,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result?.reward.name).toBe('3x Chaos Orb');
        expect(result?.reward.chaosPrice).toBe(3);
      });

      it('should handle Chaos Orb as always trusted', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 0.5,
          count: 15, // Above MIN_TRUST_COUNT
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
          // No receive data - should still pass for Chaos Orb
        };

        const card: CurrencyCard = {
          type: 'currency',
          name: 'Test Card',
          reward: 'Chaos Orb',
          rewardSpec: {
            amount: 2,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.reward.chaosPrice).toBe(2);
      });

      it('should return null when card count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 1,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: { count: 50 },
        };

        const card: CurrencyCard = {
          type: 'currency',
          name: 'Test Card',
          reward: 'Exalted Orb',
          rewardSpec: {
            amount: 1,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when currency receive count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 1,
          count: 20,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: { count: 5 }, // Below MIN_TRUST_COUNT
        };

        const card: CurrencyCard = {
          type: 'currency',
          name: 'Test Card',
          reward: 'Exalted Orb',
          rewardSpec: {
            amount: 1,
          },
        };

        mockCardMatcher.matchCard.mockReturnValue(cardOverview);
        mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

        const result = service.calculateCardProfit(leagueData, card);

        expect(result).toBeNull();
      });
    });
  });

  describe('generateFlipTable', () => {
    it('should generate flip table for multiple cards', () => {
      const leagueData: LeagueData = { items: [], currency: [] };

      const card1Overview: ItemOverview = {
        name: 'Card 1',
        itemClass: 6,
        chaosValue: 10,
        count: 50,
        stackSize: 1,
      };

      const card1Reward: ItemOverview = {
        name: 'Item 1',
        itemClass: 2,
        chaosValue: 100,
        count: 20,
      };

      const card2Overview: ItemOverview = {
        name: 'Card 2',
        itemClass: 6,
        chaosValue: 5,
        count: 100,
        stackSize: 1,
      };

      const card2Reward: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      const cards: Card[] = [
        {
          type: 'item',
          name: 'Card 1',
          reward: 'Item 1',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        },
        {
          type: 'currency',
          name: 'Card 2',
          reward: 'Chaos Orb',
          rewardSpec: {
            amount: 2,
          },
        },
      ];

      mockCardMatcher.matchCard
        .mockReturnValueOnce(card1Overview)
        .mockReturnValueOnce(card2Overview);

      mockCardMatcher.matchReward
        .mockReturnValueOnce(card1Reward)
        .mockReturnValueOnce(card2Reward);

      const result = service.buildFlipTable(leagueData, cards);

      expect(result).toHaveLength(1); // Only card 1 is profitable (100 - 10 = 90)
      expect(result[0].Card.name).toBe('Card 1');
      expect(result[0].chaosProfit).toBeGreaterThan(0);
    });

    it('should filter out unprofitable cards', () => {
      const cardOverview: ItemOverview = {
        name: 'Unprofitable Card',
        itemClass: 6,
        chaosValue: 100,
        count: 50,
        stackSize: 1,
      };

      const rewardOverview: ItemOverview = {
        name: 'Low Value Item',
        itemClass: 2,
        chaosValue: 50,
        count: 20,
      };

      const cards: Card[] = [
        {
          type: 'item',
          name: 'Unprofitable Card',
          reward: 'Low Value Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        },
      ];

      mockCardMatcher.matchCard.mockReturnValue(cardOverview);
      mockCardMatcher.matchReward.mockReturnValue(rewardOverview);

      const result = service.buildFlipTable(leagueData, cards);

      expect(result).toHaveLength(0);
    });

    it('should filter out cards with missing matches', () => {
      const cards: Card[] = [
        {
          type: 'item',
          name: 'Missing Card',
          reward: 'Missing Item',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        },
      ];

      mockCardMatcher.matchCard.mockReturnValue(null);
      mockCardMatcher.matchReward.mockReturnValue(null);

      const result = service.buildFlipTable(leagueData, cards);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty cards array', () => {
      const result = service.buildFlipTable(leagueData, []);

      expect(result).toEqual([]);
    });
  });
});
