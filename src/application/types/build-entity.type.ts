import LeagueEntity, {
  LeagueEntityProps,
} from '../../domain/entities/league.entity';

export interface EntityMap {
  LeagueEntity: LeagueEntity;
}

export interface EntityPropsMap {
  LeagueEntity: LeagueEntityProps;
}

export type EntityNames = keyof EntityMap;
