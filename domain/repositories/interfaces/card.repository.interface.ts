import { CardEntity } from '@domain/entities/card.entity';

export interface ICardRepository {
  getAllCards(): CardEntity[];
}
