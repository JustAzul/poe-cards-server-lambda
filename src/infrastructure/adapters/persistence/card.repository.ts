import { DivinationCard } from '@domain/entities/card.entity';
import { ICardRepository } from '@domain/repositories/card.repository';
import { cards as rawCardsData } from '@config/cards';
import { currencyCards as rawCurrencyCardsData } from '@config/currency-cards';

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
