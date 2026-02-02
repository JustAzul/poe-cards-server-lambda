import {
  RewardType,
  RewardSpec,
  createCurrencyRewardSpec,
  createItemRewardSpec,
} from '@domain/value-objects/reward-spec';

/**
 * Card Entity - Divination card with identity and reward specification
 * Unified entity replacing abstract hierarchy (ItemCard/CurrencyCard)
 * Encapsulates card identity and reward type information
 */
export class DivinationCard {
  constructor(
    readonly name: string,
    readonly reward: string,
    readonly rewardSpec: RewardSpec,
  ) {}

  /**
   * Factory: Create Card from item card configuration
   */
  static fromItemCardConfig(raw: {
    Name: string;
    Reward: string;
    Corrupted: boolean;
    iClass: number;
    Links: number;
    gemLevel: number;
  }): DivinationCard {
    return new DivinationCard(
      raw.Name,
      raw.Reward,
      createItemRewardSpec(raw.iClass, raw.Corrupted, raw.Links, raw.gemLevel),
    );
  }

  /**
   * Factory: Create Card from currency card configuration
   */
  static fromCurrencyCardConfig(raw: {
    Name: string;
    Reward: string;
    Amount: number;
  }): DivinationCard {
    return new DivinationCard(
      raw.Name,
      raw.Reward,
      createCurrencyRewardSpec(raw.Amount),
    );
  }

  /**
   * Type guard: Check if this is a currency card
   */
  isCurrencyCard(): boolean {
    return this.rewardSpec.type === RewardType.CURRENCY;
  }
}
