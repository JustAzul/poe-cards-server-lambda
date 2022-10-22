import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';

export type DivinationCardItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.DIVINATION_CARD;
  artFilename: string;
  stackSize: number;
};
