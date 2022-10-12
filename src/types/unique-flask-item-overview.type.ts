import { ItemClassDictionary } from './item-class-dictionary.type';
import { ItemOverview } from './item-overview.type';
import { ItemOverviewBaseType } from './item-overview-base-type.type';

export type UniqueFlaskItemOverview = Omit<ItemOverview, 'itemClass'> & {
    itemClass: ItemClassDictionary.UNIQUE_FLASK;
    baseType : ItemOverviewBaseType;
    levelRequired : number;
    variant: never;
}
