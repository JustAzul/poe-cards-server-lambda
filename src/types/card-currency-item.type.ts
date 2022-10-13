import { CardItem } from './card-item.type';

export type CardCurrencyItem = Pick<CardItem, 'Name' | 'Reward'> & {
  Amount: number;
};
