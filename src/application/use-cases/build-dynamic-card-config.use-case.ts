import {
  FetchDivinationCardRewardsUseCaseInterfaces,
} from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import { ItemClass } from '@/domain/entities/item-class.enum';
import parseDivinationCardReward, { 
  DivinationCardReward,
} from '@/shared/helpers/parse-divination-card-reward.helper';

export interface DynamicCardConfig {
  readonly cards: ReadonlyArray<{
    readonly cardName: string;
    readonly corrupted: boolean;
    readonly gemLevel: number;
    readonly itemClass: ItemClass;
    readonly links: number;
    readonly rewardName: string;
  }>;
  readonly currencyCards: ReadonlyArray<{
    readonly cardName: string;
    readonly amount: number;
    readonly rewardName: string;
  }>;
}

export interface BuildDynamicCardConfigUseCaseConstructor {
  readonly interfaces: FetchDivinationCardRewardsUseCaseInterfaces;
}

export default class BuildDynamicCardConfigUseCase {
  private readonly repository = this.interfaces.repository;

  constructor(private readonly interfaces: FetchDivinationCardRewardsUseCaseInterfaces) {}

  async execute(league: string): Promise<DynamicCardConfig> {
    try {
      const cardRewards = await this.repository.fetchAll(league);
      
      const cards: DynamicCardConfig['cards'][number][] = [];
      const currencyCards: DynamicCardConfig['currencyCards'][number][] = [];

      for (const cardReward of cardRewards) {
        try {
          const parsed = this.parseCardReward(cardReward.reward, cardReward.cardName);
          
          if ('amount' in parsed) {
            currencyCards.push(parsed);
          } else {
            cards.push(parsed);
          }
        } catch (error) {
          // Skip invalid cards and continue processing
          console.warn(`Failed to parse card reward for ${cardReward.cardName}:`, error);
        }
      }

      return { cards, currencyCards };
    } catch (error) {
      console.error('Failed to build dynamic card configuration:', error);
      return { cards: [], currencyCards: [] };
    }
  }

  private parseCardReward(
    reward: DivinationCardReward,
    cardName: string
  ): DynamicCardConfig['cards'][number] | DynamicCardConfig['currencyCards'][number] {
    // Use the existing helper but adapt the logic for our new architecture
    if (reward.type === 'currencyitem') {
      return {
        cardName,
        amount: reward.quantity || 1,
        rewardName: reward.name,
      };
    }

    return {
      cardName,
      corrupted: reward.corrupted || false,
      gemLevel: reward.level || 0,
      itemClass: this.mapTypeToItemClass(reward.type),
      links: reward.links || 0,
      rewardName: reward.name,
    };
  }

  private mapTypeToItemClass(type: string): ItemClass {
    switch (type) {
      case 'uniqueitem':
        return ItemClass.Unique;
      case 'gemitem':
        return ItemClass.Gem;
      case 'divination':
        return ItemClass.DivinationCard;
      default:
        return ItemClass.Unique;
    }
  }
} 