import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverviewItemType } from './item-overview-item-type.type';
import { ItemOverview } from './item-overview.type';

export type UniqueArmourItemOverview = Omit<ItemOverview, 'itemClass'> & {
  baseType: ItemOverviewBaseType;
  itemClass: ItemClassDictionary.UNIQUE_ARMOUR;
  itemType: ItemOverviewItemType;
  levelRequired: number;
  links?: 6 | 5;
  variant: never;
};
