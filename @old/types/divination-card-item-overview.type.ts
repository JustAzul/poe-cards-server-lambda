import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';

export type DivinationCardItemOverview = Omit<ItemOverview, 'itemClass'> & {
  artFilename: string;
  itemClass: ItemClassDictionary.DIVINATION_CARD;
  stackSize: number;
};
