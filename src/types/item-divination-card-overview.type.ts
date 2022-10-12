import { ExplicitModifier } from './explicit-modifier.type';
import { ItemClass } from './item-overview-class-enum.type';
import { SparklineData } from './sparkline-data.type';

export type ItemDivinationCardOverview = {
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
    itemClass: ItemClass.DIVINATION_CARD;
    listingCount: number;
    lowConfidenceSparkline: SparklineData;
    name: string;
    sparkline: SparklineData;
    stackSize: number;
}