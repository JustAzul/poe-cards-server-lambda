import { IHttpClient } from 'application/ports/http-client.interface';
import { ILeagueRepository } from 'application/ports/http-repository.interface';
import { IHttpLeagueMapper } from 'application/ports/mapper.interface';
import InfraException from 'infra/exceptions/infra.exception';
import LeagueEntity from 'domain/entities/league.entity';

import { HttpLeagueResponse } from './types/http-league-response.type';

export default class HttpLeagueRepository implements ILeagueRepository {
  private readonly mapper: IHttpLeagueMapper;

  constructor(
    private readonly httpClient: IHttpClient,
    mapper: IHttpLeagueMapper,
  ) {
    this.mapper = mapper;
  }

  async fetchAll(): Promise<LeagueEntity[]> {
    const { data } = await this.httpClient.get<HttpLeagueResponse[]>({
      url: 'https://api.pathofexile.com/leagues',
    });

    if (!data) {
      throw new InfraException(
        `${HttpLeagueRepository.name}#${this.fetchAll.name}`,
        'No data found',
      );
    }

    const entities = data.map((league) => this.mapper.toDomain(league));
    return entities;
  }
}
