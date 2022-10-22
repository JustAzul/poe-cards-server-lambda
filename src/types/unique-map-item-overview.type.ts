import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';

export type UniqueMapItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.UNIQUE_MAP;
  baseType: ItemOverviewBaseType;
  mapTier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
};
