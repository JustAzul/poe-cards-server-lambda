import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverview } from './item-overview.type';

export type UniqueMapItemOverview = Omit<ItemOverview, 'itemClass'> & {
  baseType: ItemOverviewBaseType;
  itemClass: ItemClassDictionary.UNIQUE_MAP;
  mapTier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
};
