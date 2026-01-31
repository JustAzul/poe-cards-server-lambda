/**
 * Base properties shared by all divination cards
 */
interface BaseCard {
  name: string;
  reward: string;
}

/**
 * Item card - rewards items from league data
 * Includes specifications for matching items by class, corruption, links, and gem level
 */
export interface ItemCard extends BaseCard {
  type: 'item';
  rewardSpec: {
    iClass: number;
    corrupted: boolean;
    links: number;
    gemLevel: number;
  };
}

/**
 * Currency card - rewards currency from league data
 * Includes amount specification for stacking currency rewards
 */
export interface CurrencyCard extends BaseCard {
  type: 'currency';
  rewardSpec: {
    amount: number;
  };
}

/**
 * Discriminated union representing any divination card
 * Type field serves as the discriminator for type narrowing
 */
export type Card = ItemCard | CurrencyCard;

/**
 * Type guard to check if a card is an item card
 */
export function isItemCard(card: Card): card is ItemCard {
  return card.type === 'item';
}

/**
 * Type guard to check if a card is a currency card
 */
export function isCurrencyCard(card: Card): card is CurrencyCard {
  return card.type === 'currency';
}
