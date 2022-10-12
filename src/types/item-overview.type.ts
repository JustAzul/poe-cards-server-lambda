import { ExplicitModifier } from './explicit-modifier.type';
import { SparklineData } from './sparkline-data.type';

export type ItemOverview = {
    chaosValue: number;
    count: number;
    detailsId: string;
    divineValue: number;
    exaltedValue: number;
    explicitModifiers: ExplicitModifier[];
    flavourText: string;
    icon: string;
    id: number;
    implicitModifiers: never[];
    itemClass: number;
    listingCount: number;
    lowConfidenceSparkline: SparklineData;
    name: string;
    sparkline: SparklineData;
}
