import { CardEntity } from '@domain/entities/card.entity';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';

const cardsData = require('../../config/cards') as CardEntity[];

export class CardRepository implements ICardRepository {
  private cards: CardEntity[];

  constructor() {
    this.cards = cardsData;
  }

  getAllCards(): CardEntity[] {
    return this.cards;
  }

  getCardByName(name: string): CardEntity | undefined {
    return this.cards.find(card => card.Name === name);
  }

  getCardsByReward(reward: string): CardEntity[] {
    return this.cards.filter(card => card.Reward === reward);
  }
}

export const cardRepository = new CardRepository();
