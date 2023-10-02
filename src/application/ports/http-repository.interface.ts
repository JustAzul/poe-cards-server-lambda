import { EntityMap, EntityNames } from '../types/build-entity.type';

interface IHttpRepository<T extends EntityNames> {
  fetchAll(): Promise<Array<EntityMap[T]>>;
}

export interface ILeagueRepository extends IHttpRepository<'LeagueEntity'> {}
