import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';

export type UniqueJewelItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.UNIQUE_JEWEL;
  baseType: ItemOverviewBaseType;
  variant: never;
};
