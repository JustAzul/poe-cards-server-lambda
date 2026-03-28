/**
 * Reward Specification - Typed discrimination for card reward types
 * Enables type-safe handling of different reward categories
 */

import { ItemClass } from '@domain/value-objects/item-class.enum';

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
  itemClass: ItemClass;
  corrupted: boolean;
  links: number;
  gemLevel: number;
}

export type RewardSpec = CurrencyRewardSpec | ItemRewardSpec;

/**
 * Factory function to create currency reward spec
 */
export function createCurrencyRewardSpec(amount: number): CurrencyRewardSpec {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid currency reward amount: ${amount}`);
  }
  return {
    type: RewardType.CURRENCY,
    amount,
  };
}

/**
 * Factory function to create item reward spec
 */
export function createItemRewardSpec(
  itemClass: ItemClass,
  corrupted: boolean,
  links: number,
  gemLevel: number,
): ItemRewardSpec {
  if (!Number.isFinite(links) || links < 0) {
    throw new Error(`Invalid links value: ${links}`);
  }
  if (!Number.isFinite(gemLevel) || gemLevel < 0) {
    throw new Error(`Invalid gemLevel value: ${gemLevel}`);
  }
  return {
    type: RewardType.ITEM,
    itemClass,
    corrupted,
    links,
    gemLevel,
  };
}
