import { SparklineData } from './sparkline-data.type';

export type CurrencyOverview = {
    chaosEquivalent: number;
    currencyTypeName: string;
    detailsId: string;
    lowConfidencePaySparkLine: SparklineData;
    lowConfidenceReceiveSparkLine: SparklineData;
    pay: never;
    paySparkLine: SparklineData;
    receive: never;
    receiveSparkLine: SparklineData;
};
