/**
 * Reward Specification - Typed discrimination for card reward types
 * Enables type-safe handling of different reward categories
 */

export enum RewardType {
  CURRENCY = 'CURRENCY',
  ITEM = 'ITEM'
}

export interface CurrencyRewardSpec {
  type: RewardType.CURRENCY;
  amount: number;
}

export interface ItemRewardSpec {
  type: RewardType.ITEM;
  itemClass: number;
  corrupted: boolean;
  links: number;
  gemLevel: number;
}

export type RewardSpec = CurrencyRewardSpec | ItemRewardSpec;

/**
 * Factory function to create currency reward spec
 */
export function createCurrencyRewardSpec(amount: number): CurrencyRewardSpec {
  return {
    type: RewardType.CURRENCY,
    amount,
  };
}

/**
 * Factory function to create item reward spec
 */
export function createItemRewardSpec(
  itemClass: number,
  corrupted: boolean,
  links: number,
  gemLevel: number,
): ItemRewardSpec {
  return {
    type: RewardType.ITEM,
    itemClass,
    corrupted,
    links,
    gemLevel,
  };
}
