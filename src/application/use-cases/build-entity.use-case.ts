import LeagueEntity, {
  LeagueEntityProps,
} from '../../domain/entities/league.entity';

interface EntityMap {
  LeagueEntity: LeagueEntity;
}

interface EntityPropsMap {
  LeagueEntity: LeagueEntityProps;
}

type EntityNames = keyof EntityMap;

export default class BuildEntityUseCase<T extends EntityNames> {
  private readonly entityName: T;

  constructor(entityName: T) {
    this.entityName = entityName;
  }

  public execute(props: EntityPropsMap[T]): EntityMap[T] {
    if (this.entityName === LeagueEntity.name) {
      return new LeagueEntity(props) as EntityMap[T];
    }

    throw new Error(`Entity ${this.entityName} is not supported.`);
  }
}
