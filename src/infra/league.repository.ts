import { IHttpClient } from '../application/ports/http-client.interface';
import { ILeagueMapper } from '../application/ports/mapper.interface';
import { ILeagueRepository } from '../application/ports/repository.interface';

import InfraException from './exceptions/infra.exception';
import LeagueMapper from './league.mapper';
import { HttpLeagueResponse } from './types/league.type';

export default class HttpLeagueRepository implements ILeagueRepository {
  private readonly httpClient: IHttpClient;

  private readonly mapper: ILeagueMapper = new LeagueMapper();

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async findAll() {
    const { data } = await this.httpClient.get<HttpLeagueResponse[]>({
      url: 'https://api.pathofexile.com/leagues',
    });

    if (!data) {
      throw new InfraException(
        `${HttpLeagueRepository.name}#${this.findAll.name}`,
        'No data found',
      );
    }

    const entities = data.map((league) => this.mapper.toDomain(league));
    return entities;
  }
}
