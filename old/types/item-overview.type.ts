import { Modifier } from './modifier.type';
import { SparklineData } from './sparkline-data.type';

export type ItemOverview = {
  chaosValue: number;
  count: number;
  detailsId: string;
  divineValue: number;
  exaltedValue: number;
  explicitModifiers: Modifier[];
  flavourText: string;
  icon: string;
  id: number;
  implicitModifiers: Modifier[];
  itemClass: number;
  listingCount: number;
  lowConfidenceSparkline: SparklineData;
  name: string;
  sparkline: SparklineData;
};
