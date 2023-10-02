import { EntityNames, EntityMap } from '../types/build-entity.type';

interface IMapper<T extends EntityNames> {
  toDomain(data: unknown): EntityMap[T];
}

export interface IHttpLeagueMapper extends IMapper<'LeagueEntity'> {}
