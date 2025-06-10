import { CurrencyDetails } from './currency-details.type';
import { CurrencyOverview } from './currency-overview.type';

export type LeagueCurrencyOverview = {
  data: CurrencyOverview[];
  details: CurrencyDetails[];
};
