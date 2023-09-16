import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverview } from './item-overview.type';

export type UniqueJewelItemOverview = Omit<ItemOverview, 'itemClass'> & {
  baseType: ItemOverviewBaseType;
  itemClass: ItemClassDictionary.UNIQUE_JEWEL;
  variant: never;
};
