import LeagueEntity, {
  LeagueEntityProps,
} from '../../domain/entities/league.entity';
import ItemOverviewEntity, {
  PoeNinjaItemOverviewLine,
} from '../../domain/entities/item-overview.entity';
import CurrencyOverviewEntity, {
  PoeNinjaCurrencyOverviewLine,
} from '../../domain/entities/currency-overview.entity';

export type EntityMap = {
  LeagueEntity: LeagueEntity;
  ItemOverviewEntity: ItemOverviewEntity;
  CurrencyOverviewEntity: CurrencyOverviewEntity;
};

export type EntityPropsMap = {
  LeagueEntity: LeagueEntityProps;
  ItemOverviewEntity: PoeNinjaItemOverviewLine;
  CurrencyOverviewEntity: PoeNinjaCurrencyOverviewLine;
};

export type EntityNames = keyof EntityMap;
