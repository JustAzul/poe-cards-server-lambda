import { DivinationCard } from '@domain/entities/card.entity';
import { ICardRepository } from '@domain/repositories/card.repository';

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

// eslint-disable-next-line global-require,@typescript-eslint/no-require-imports
const rawCardsData = require('@config/cards') as RawCardData[];
// eslint-disable-next-line global-require,@typescript-eslint/no-require-imports
const rawCurrencyCardsData = require('@config/currency-cards') as RawCurrencyCardData[];

/**
 * Unified card repository that loads both item and currency cards
 * from config files and transforms them into domain entities
 */
export class CardRepository implements ICardRepository {
  private cards: DivinationCard[];

  constructor() {
    // Map item cards from config data to domain entities
    const itemCards: DivinationCard[] = rawCardsData.map(
      (raw) => DivinationCard.fromItemCardConfig(raw),
    );

    // Map currency cards from config data to domain entities
    const currencyCards: DivinationCard[] = rawCurrencyCardsData.map(
      (raw) => DivinationCard.fromCurrencyCardConfig(raw),
    );

    // Combine both types into single unified array
    this.cards = [...itemCards, ...currencyCards];
  }

  getAllCards(): DivinationCard[] {
    return this.cards;
  }
}

export const cardRepository = new CardRepository();
