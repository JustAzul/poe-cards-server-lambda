import { ILeagueMapper } from '../application/ports/mapper.interface';
import BuildEntityUseCase from '../application/use-cases/build-entity.use-case';

import { HttpLeagueResponse } from './types/league.type';

const entityTargetName = 'LeagueEntity';

export default class LeagueMapper implements ILeagueMapper {
  private readonly entityBuilder: BuildEntityUseCase<typeof entityTargetName>;

  constructor() {
    this.entityBuilder = new BuildEntityUseCase(entityTargetName);
  }

  toDomain(league: HttpLeagueResponse) {
    return this.entityBuilder.execute(league);
  }
}
