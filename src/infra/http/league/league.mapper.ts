import { IHttpLeagueMapper } from 'application/ports/mapper.interface';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';

import { HttpLeagueResponse } from './types/http-league-response.type';

export default class HttpLeagueMapper implements IHttpLeagueMapper {
  constructor(
    private readonly entityBuilder: BuildEntityUseCase<'LeagueEntity'>,
  ) {}

  toDomain(league: HttpLeagueResponse) {
    return this.entityBuilder.execute(league);
  }
}
