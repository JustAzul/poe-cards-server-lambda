import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverview } from './item-overview.type';

export type UniqueFlaskItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.UNIQUE_FLASK;
  baseType: ItemOverviewBaseType;
  levelRequired: number;
  variant: never;
};
