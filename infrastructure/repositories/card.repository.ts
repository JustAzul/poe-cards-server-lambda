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
}

export const cardRepository = new CardRepository();
