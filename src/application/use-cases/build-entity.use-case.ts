import LeagueEntity from '../../domain/entities/league.entity';
import {
  EntityNames,
  EntityPropsMap,
  EntityMap,
} from '../types/build-entity.type';

export default class BuildEntityUseCase<T extends EntityNames> {
  private readonly entityName: T;

  constructor(entityName: T) {
    this.entityName = entityName;
  }

  public execute(props: EntityPropsMap[T]): EntityMap[T] {
    if (this.entityName === LeagueEntity.name) {
      return new LeagueEntity(props);
    }

    throw new Error(`Entity ${this.entityName} is not supported.`);
  }
}
