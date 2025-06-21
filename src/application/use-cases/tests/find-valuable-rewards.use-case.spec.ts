import { IDivinationCardRewardsRepository } from 'application/ports/divination-card-rewards-repository.interface';
import { IItemOverviewRepository } from 'application/ports/http-repository.interface';
import { DivinationCardRewardType } from 'shared/helpers/parse-divination-card-reward.helper';
import FindValuableRewardsUseCase from 'application/use-cases/find-valuable-rewards.use-case';

describe(FindValuableRewardsUseCase.name, () => {
  it('should create a dynamic fetch list from card rewards', async () => {
    // Arrange
    const mockRewards = [
      { cardName: 'The Doctor', reward: { name: 'Headhunter', type: DivinationCardRewardType.UniqueItem, corrupted: false } },
      { cardName: 'The Nurse', reward: { name: 'Headhunter', type: DivinationCardRewardType.UniqueItem, corrupted: false } },
      { cardName: 'The Fiend', reward: { name: 'Headhunter', type: DivinationCardRewardType.UniqueItem, corrupted: true } },
      { cardName: 'The Wrath', reward: { name: 'Chaos Orb', type: DivinationCardRewardType.CurrencyItem, corrupted: false, quantity: 10 } },
    ];
    
    const rewardsRepository: IDivinationCardRewardsRepository = {
      fetchAll: jest.fn(),
    };
    (rewardsRepository.fetchAll as jest.Mock).mockResolvedValue(mockRewards);

    const itemRepository: IItemOverviewRepository = {
      fetchAll: jest.fn(),
      fetchByNames: jest.fn(),
    };
    (itemRepository.fetchByNames as jest.Mock).mockResolvedValue([]);

    const useCase = new FindValuableRewardsUseCase({
      rewardsRepository,
      itemRepository,
    });

    // Act
    await useCase.execute('Standard');

    // Assert
    expect(rewardsRepository.fetchAll).toHaveBeenCalledWith('Standard');
    
    const expectedDynamicFetchList = [
      // Divination Cards
      'The Doctor',
      'The Nurse',
      'The Fiend',
      'The Wrath',
      // Unique Rewards (deduplicated)
      'Headhunter',
      // Currency rewards are handled separately and not part of this item fetch list
    ];

    expect(itemRepository.fetchByNames).toHaveBeenCalledWith({
      league: 'Standard',
      itemNames: expect.arrayContaining(expectedDynamicFetchList),
    });
  });
}); 