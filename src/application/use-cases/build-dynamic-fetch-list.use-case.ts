import { IDivinationCardRewardsRepository } from 'application/ports/divination-card-rewards-repository.interface';
import { CardRewardResult } from './fetch-divination-card-rewards.use-case';
import {
  DivinationCardReward,
  DivinationCardRewardType,
} from 'shared/helpers/parse-divination-card-reward.helper';

interface BuildDynamicFetchListUseCaseConstructor {
  readonly divinationCardRewardsRepository: IDivinationCardRewardsRepository;
}

export default class BuildDynamicFetchListUseCase {
  constructor(
    private readonly dependencies: BuildDynamicFetchListUseCaseConstructor,
  ) {}

  async execute(league: string): Promise<string[]> {
    const cardRewards = await this.dependencies.divinationCardRewardsRepository.fetchAll(league);
    const rewardTypes = new Set<string>();

    for (const card of cardRewards) {
      this.mapRewardToFetchType(card, rewardTypes);
    }

    return Array.from(rewardTypes);
  }

  private mapRewardToFetchType(card: CardRewardResult, types: Set<string>): void {
    const { reward } = card;
    // Always fetch DivinationCard data to get their prices
    types.add('DivinationCard');

    switch (reward.type) {
      case DivinationCardRewardType.UniqueItem:
        this.addUniqueItemType(reward, types);
        break;
      case DivinationCardRewardType.CurrencyItem:
        // Currency is handled by a separate endpoint, but we can add its type for consistency
        types.add('Currency');
        break;
      case DivinationCardRewardType.GemItem:
        types.add('SkillGem');
        break;
      case DivinationCardRewardType.DivinationCard:
        // This is a card that gives another card, already handled
        break;
      default:
      // Other types like normal, magic, rare items don't have a specific poe.ninja category
      // We can add more specific handling here if needed in the future
    }
  }

  private addUniqueItemType(reward: DivinationCardReward, types: Set<string>): void {
    // This is a simplified mapping. A more robust solution would
    // require fetching item base types or having a static mapping.
    // For now, we'll use broad categories based on common unique item names.
    const name = reward.name.toLowerCase();

    if (name.includes('flask')) types.add('UniqueFlask');
    else if (name.includes('jewel')) types.add('UniqueJewel');
    else if (name.includes('map') || name.includes('atlas')) types.add('UniqueMap');
    else if (
      name.includes('sword') ||
      name.includes('axe') ||
      name.includes('mace') ||
      name.includes('bow') ||
      name.includes('staff') ||
      name.includes('wand') ||
      name.includes('sceptre') ||
      name.includes('dagger') ||
      name.includes('claw')
    )
      types.add('UniqueWeapon');
    else if (
      name.includes('ring') ||
      name.includes('amulet') ||
      name.includes('belt')
    )
      types.add('UniqueAccessory');
    else {
      // Default to armour as a broad category
      types.add('UniqueArmour');
    }
  }
} 