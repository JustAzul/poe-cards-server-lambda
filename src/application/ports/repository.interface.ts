import { EntityMap, EntityNames } from '../types/build-entity.type';

interface IRepository<T extends EntityNames> {
  findAll(): Promise<Array<EntityMap[T]>>;
}

export interface ILeagueRepository extends IRepository<'LeagueEntity'> {}
