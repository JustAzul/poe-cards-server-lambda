import { EntityMap, EntityNames } from 'application/types/build-entity.type';

interface IHttpRepository<T extends EntityNames> {
  fetchAll(): Promise<Array<EntityMap[T]>>;
}

export interface ILeagueRepository extends IHttpRepository<'LeagueEntity'> {}

import { PoeNinjaQueryParams } from 'infra/http/poe-ninja';

export interface IItemOverviewRepository {
  fetchAll(
    params: PoeNinjaQueryParams,
  ): Promise<Array<EntityMap['ItemOverviewEntity']>>;
}

export interface ICurrencyOverviewRepository {
  fetchAll(
    params: PoeNinjaQueryParams,
  ): Promise<Array<EntityMap['CurrencyOverviewEntity']>>;
}
