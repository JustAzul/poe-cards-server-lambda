import { EntityMap, EntityNames } from 'application/types/build-entity.type';

interface IHttpRepository<T extends EntityNames> {
  fetchAll(): Promise<Array<EntityMap[T]>>;
}

export interface ILeagueRepository extends IHttpRepository<'LeagueEntity'> {}
