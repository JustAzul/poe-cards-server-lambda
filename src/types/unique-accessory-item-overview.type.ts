import { ItemClassDictionary } from './item-class-dictionary.type';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverviewItemType } from './item-overview-item-type.type';

export type UniqueAccessoryItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.UNIQUE_ACCESSORY;
  baseType: ItemOverviewBaseType;
  itemType: ItemOverviewItemType;
  variant: never;
};
