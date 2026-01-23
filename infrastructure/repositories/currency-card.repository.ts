import { CurrencyCardEntity } from '@domain/entities/currency-card.entity';
import { ICurrencyCardRepository } from '@domain/repositories/interfaces/currency-card.repository.interface';

const currencyCardsData = require('@config/currency-cards') as CurrencyCardEntity[];

export class CurrencyCardRepository implements ICurrencyCardRepository {
  private currencyCards: CurrencyCardEntity[];

  constructor() {
    this.currencyCards = currencyCardsData;
  }

  getAllCurrencyCards(): CurrencyCardEntity[] {
    return this.currencyCards;
  }
}

export const currencyCardRepository = new CurrencyCardRepository();
