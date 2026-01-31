import { Card } from '@domain/entities/card.entity';

export interface ICardRepository {
  getAllCards(): Card[];
}
