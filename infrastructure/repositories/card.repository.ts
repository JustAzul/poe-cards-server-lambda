import { Card } from '@domain/entities/card.base.entity';
import { ItemCard } from '@domain/entities/item-card.entity';
import { CurrencyCard } from '@domain/entities/currency-card.entity';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';

/**
 * Raw data structure from cards config file
 */
interface RawCardData {
  Name: string;
  Reward: string;
  Corrupted: boolean;
  iClass: number;
  Links: number;
  gemLevel: number;
}

/**
 * Raw data structure from currency-cards config file
 */
interface RawCurrencyCardData {
  Name: string;
  Reward: string;
  Amount: number;
}

const rawCardsData = require('@config/cards') as RawCardData[];
const rawCurrencyCardsData = require('@config/currency-cards') as RawCurrencyCardData[];

/**
 * Unified card repository that loads both item and currency cards
 * from config files and transforms them into domain entities
 */
export class CardRepository implements ICardRepository {
  private cards: Card[];

  constructor() {
    // Map item cards from config data to domain entities
    const itemCards: ItemCard[] = rawCardsData.map((raw) => ItemCard.fromConfig(raw));

    // Map currency cards from config data to domain entities
    const currencyCards: CurrencyCard[] = rawCurrencyCardsData.map(
      (raw) => CurrencyCard.fromConfig(raw),
    );

    // Combine both types into single unified array
    this.cards = [...itemCards, ...currencyCards];
  }

  getAllCards(): Card[] {
    return this.cards;
  }
}

export const cardRepository = new CardRepository();
