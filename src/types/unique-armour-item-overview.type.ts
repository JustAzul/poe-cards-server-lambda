import { ItemClassDictionary } from './item-class-dictionary.type';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverviewItemType } from './item-overview-item-type.type';

export type UniqueArmourItemOverview = Omit<ItemOverview, 'itemClass'> & {
    itemClass: ItemClassDictionary.UNIQUE_ARMOUR;
    baseType : ItemOverviewBaseType;
    itemType : ItemOverviewItemType;
    levelRequired : number;
    variant: never;
    links?: 6 | 5 ;
}
