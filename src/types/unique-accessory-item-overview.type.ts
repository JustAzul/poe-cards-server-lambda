import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverviewItemType } from './item-overview-item-type.type';
import { ItemOverview } from './item-overview.type';

export type UniqueAccessoryItemOverview = Omit<ItemOverview, 'itemClass'> & {
  baseType: ItemOverviewBaseType;
  itemClass: ItemClassDictionary.UNIQUE_ACCESSORY;
  itemType: ItemOverviewItemType;
  variant: never;
};
