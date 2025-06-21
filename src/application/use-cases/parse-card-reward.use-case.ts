import { CardRewardResult } from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import { ItemClass } from '@/domain/entities/item-class.enum';

export interface ParsedCardResult {
  cardName: string;
  corrupted: boolean;
  gemLevel: number;
  itemClass: ItemClass;
  links: number;
  rewardName: string;
}

export interface ParsedCurrencyResult {
  cardName: string;
  amount: number;
  rewardName: string;
}

export default class ParseCardRewardUseCase {
  execute(cardReward: CardRewardResult): ParsedCardResult | ParsedCurrencyResult {
    // Minimal implementation for TDD - will be expanded
    const { cardName, reward } = cardReward;
    
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
      case 'currencyitem':
        return ItemClass.DivinationCard;
      default:
        return ItemClass.Unique;
    }
  }
} 