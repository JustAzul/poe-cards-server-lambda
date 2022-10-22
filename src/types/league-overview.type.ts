import { LeagueCurrencyOverview } from './league-currency-overview.type';
import { LeagueItemsOverview } from './league-items-overview.type';

export type LeagueOverview = {
  currencyOverview: LeagueCurrencyOverview;
  itemsOverview: LeagueItemsOverview;
};
