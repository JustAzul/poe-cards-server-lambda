import { IHttpClient } from '../../../application/ports/http-client.interface';
import { ILeagueRepository } from '../../../application/ports/http-repository.interface';
import { IHttpLeagueMapper } from '../../../application/ports/mapper.interface';
import InfraException from '../../exceptions/infra.exception';

import HttpLeagueMapper from './league.mapper';
import { HttpLeagueResponse } from './types/http-league-response.type';

export default class HttpLeagueRepository implements ILeagueRepository {
  private readonly httpClient: IHttpClient;

  private readonly mapper: IHttpLeagueMapper = new HttpLeagueMapper();

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async fetchAll() {
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
