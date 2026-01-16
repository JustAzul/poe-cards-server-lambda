import { CurrencyCardEntity } from '@domain/entities/currency-card.entity';
import { ICurrencyCardRepository } from './interfaces/currency-card.repository.interface';

const currencyCardsData = require('../../config/currency-cards') as CurrencyCardEntity[];

export class CurrencyCardRepository implements ICurrencyCardRepository {
  private currencyCards: CurrencyCardEntity[];

  constructor() {
    this.currencyCards = currencyCardsData;
  }

  getAllCurrencyCards(): CurrencyCardEntity[] {
    return this.currencyCards;
  }

  getCurrencyCardByName(name: string): CurrencyCardEntity | undefined {
    return this.currencyCards.find(card => card.Name === name);
  }

  getCurrencyCardsByReward(reward: string): CurrencyCardEntity[] {
    return this.currencyCards.filter(card => card.Reward === reward);
  }
}

export const currencyCardRepository = new CurrencyCardRepository();
