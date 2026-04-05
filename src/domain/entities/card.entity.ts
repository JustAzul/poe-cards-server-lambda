import {
  RewardType,
  RewardSpec,
  CurrencyRewardSpec,
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
   * Type guard: Check if this is a currency card
   */
  isCurrencyCard(): this is DivinationCard & { rewardSpec: CurrencyRewardSpec } {
    return this.rewardSpec.type === RewardType.CURRENCY;
  }
}
