import LeagueEntity, {
  LeagueEntityProps,
} from '../../domain/entities/league.entity';

export type EntityMap = {
  [K in typeof LeagueEntity.name]: LeagueEntity;
};
export type EntityPropsMap = {
  [K in typeof LeagueEntity.name]: LeagueEntityProps;
};

export type EntityNames = keyof EntityMap;
