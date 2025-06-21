import { EntityMap, EntityNames } from 'application/types/build-entity.type';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';

interface IHttpRepository<T extends EntityNames> {
  fetchAll(): Promise<Array<EntityMap[T]>>;
}

export interface ILeagueRepository extends IHttpRepository<'LeagueEntity'> {}

export interface PoeNinjaItemOverviewQueryParams {
  league: string;
  type: string;
}

export interface PoeNinjaDynamicItemOverviewQueryParams {
  league: string;
  itemNames: string[];
}

export interface IItemOverviewRepository {
  fetchAll(
    params: PoeNinjaItemOverviewQueryParams,
  ): Promise<ItemOverviewEntity[]>;
  fetchByNames(
    params: PoeNinjaDynamicItemOverviewQueryParams,
  ): Promise<ItemOverviewEntity[]>;
}

export interface PoeNinjaCurrencyOverviewQueryParams {
  league: string;
  type: string;
}

export interface ICurrencyOverviewRepository {
  fetchAll(
    params: PoeNinjaCurrencyOverviewQueryParams,
  ): Promise<CurrencyOverviewEntity[]>;
}
