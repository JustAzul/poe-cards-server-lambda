import { ILeagueApi, RawLeagueData } from '@domain/ports/http-service.port';
import { LeagueApiResponse } from '@infrastructure/types/poe-api.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';

export class PoeApiService implements ILeagueApi {
  constructor(
    private readonly client: HttpClient,
  ) {}

  async fetchLeagues(): Promise<RawLeagueData[]> {
    const url = 'https://api.pathofexile.com/leagues';
    const response = await this.client.get<LeagueApiResponse[]>(url, { type: 'main', compact: 0 });

    if (!Array.isArray(response)) {
      throw new Error(`Expected array from leagues API, got ${typeof response}`);
    }

    return response;
  }
}
