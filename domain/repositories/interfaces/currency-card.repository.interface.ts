import { CurrencyCardEntity } from '@domain/entities/currency-card.entity';

export interface ICurrencyCardRepository {
  getAllCurrencyCards(): CurrencyCardEntity[];
}
