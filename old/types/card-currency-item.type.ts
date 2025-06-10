import { CardItem } from './card-item.type';

export type CardCurrencyItem = Pick<CardItem, 'cardName' | 'rewardName'> & {
  amount: number;
};
