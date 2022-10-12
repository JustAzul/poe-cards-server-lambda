import { ExplicitModifier } from './explicit-modifier.type';
import { ItemClassDictionary } from './item-class-dictionary.type';
import { SparklineData } from './sparkline-data.type';

export type DivinationCardItemOverview = {
    artFilename: string;
    chaosValue: number;
    count: number;
    detailsId: string;
    divineValue: number;
    explicitModifiers: ExplicitModifier[];
    flavourText: string;
    icon: string;
    id: number;
    implicitModifiers: never[];
    itemClass: ItemClassDictionary.DIVINATION_CARD;
    listingCount: number;
    lowConfidenceSparkline: SparklineData;
    name: string;
    sparkline: SparklineData;
    stackSize: number;
}
