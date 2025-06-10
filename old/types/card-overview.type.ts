import { CurrencyOverview } from './currency-overview.type';
import { ItemOverviewDictionary } from './item-overview-dictionary.type';
import { ItemOverviewType } from './item-overview-types.type';

export type CardOverview = {
  cardOverview: ItemOverviewDictionary[ItemOverviewType] | null;
  rewardOverview:
    | ItemOverviewDictionary[ItemOverviewType]
    | Pick<CurrencyOverview, 'chaosEquivalent' | 'currencyTypeName'>
    | null;
};
