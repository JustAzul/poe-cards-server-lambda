import CurrencyOverviewEntity, {
  PoeNinjaCurrencyOverviewLine,
} from '../../domain/entities/currency-overview.entity';
import ItemOverviewEntity, {
  PoeNinjaItemOverviewLine,
} from '../../domain/entities/item-overview.entity';
import LeagueEntity, { LeagueEntityProps } from '../../domain/entities/league.entity';
import {
  EntityMap,
  EntityNames,
  EntityPropsMap,
} from '../types/build-entity.type';

type BuilderFn<K extends EntityNames> = (
  props: EntityPropsMap[K],
) => EntityMap[K];

const builders: { [K in EntityNames]: BuilderFn<K> } = {
  LeagueEntity: (props) => new LeagueEntity(props as LeagueEntityProps),
  ItemOverviewEntity: (props) =>
    new ItemOverviewEntity(props as PoeNinjaItemOverviewLine),
  CurrencyOverviewEntity: (props) =>
    new CurrencyOverviewEntity(props as PoeNinjaCurrencyOverviewLine),
};

export default class BuildEntityUseCase<T extends EntityNames> {
  private readonly build: BuilderFn<T>;

  constructor(entityName: T) {
    const builder = builders[entityName];
    if (!builder) {
      throw new Error(`Entity ${entityName} is not supported.`);
    }
    this.build = builder as BuilderFn<T>;
  }

  execute(props: EntityPropsMap[T]): EntityMap[T] {
    return this.build(props);
  }
}
