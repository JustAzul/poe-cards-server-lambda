import { CurrencyCardEntity } from '@domain/entities/currency-card.entity';

export interface ICurrencyCardRepository {
  getAllCurrencyCards(): CurrencyCardEntity[];
  getCurrencyCardByName(name: string): CurrencyCardEntity | undefined;
  getCurrencyCardsByReward(reward: string): CurrencyCardEntity[];
}
