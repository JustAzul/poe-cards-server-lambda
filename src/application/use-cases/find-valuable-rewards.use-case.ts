import { IDivinationCardRewardsRepository } from 'application/ports/divination-card-rewards-repository.interface';
import { IItemOverviewRepository } from 'application/ports/http-repository.interface';
import { DivinationCardRewardType } from 'shared/helpers/parse-divination-card-reward.helper';

interface FindValuableRewardsUseCaseConstructor {
  readonly rewardsRepository: IDivinationCardRewardsRepository;
  readonly itemRepository: IItemOverviewRepository;
}

export default class FindValuableRewardsUseCase {
  constructor(private readonly dependencies: FindValuableRewardsUseCaseConstructor) {}

  async execute(league: string): Promise<void> {
    const { rewardsRepository, itemRepository } = this.dependencies;

    // Step 1 & 2: Fetch All Divination Cards and their rewards
    const cardRewards = await rewardsRepository.fetchAll(league);

    // Step 3: Dynamically Build Target Fetch List
    const divinationCardNames = cardRewards.map((c) => c.cardName);
    const rewardItemNames = cardRewards
      .filter((c) => c.reward.type === DivinationCardRewardType.UniqueItem)
      .map((c) => c.reward.name);
    
    const dynamicFetchList = [
      ...new Set([...divinationCardNames, ...rewardItemNames]),
    ];

    // Step 4: Fetch Market Prices for the dynamic list
    // The current IItemOverviewRepository is not designed for this.
    // This will be the next step in our TDD refactor.
    // For now, we just call it to make the test pass.
    await itemRepository.fetchByNames({
      league,
      itemNames: dynamicFetchList,
    });
  }
} 