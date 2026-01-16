import { CardEntity } from '@domain/entities/card.entity';

export interface ICardRepository {
  getAllCards(): CardEntity[];
  getCardByName(name: string): CardEntity | undefined;
  getCardsByReward(reward: string): CardEntity[];
}
