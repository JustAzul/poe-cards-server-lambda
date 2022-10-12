import { ItemClassDictionary } from './item-class-dictionary.type';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';
import { ItemOverviewItemType } from './item-overview-item-type.type';

export type UniqueWeaponItemOverview = Omit<ItemOverview, 'itemClass'> & {
    itemClass: ItemClassDictionary.UNIQUE_WEAPON;
    baseType : ItemOverviewBaseType;
    itemType : ItemOverviewItemType;
    levelRequired : number;
}
