import { CurrencyDetails } from './currency-details.type';
import { CurrencyOverview } from './currency-overview.type';
import { ItemOverviewResponse } from './item-overview-response.type';

export type CurrencyOverviewResponse =
  ItemOverviewResponse<CurrencyOverview> & {
    currencyDetails: CurrencyDetails[];
  };
