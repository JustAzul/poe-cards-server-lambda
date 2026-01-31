import { Card } from '@domain/entities/card.base.entity';

export interface ICardRepository {
  getAllCards(): Card[];
}
