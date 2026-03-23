import { ILeagueApi, RawLeagueData } from '@domain/ports/http-service.port';
import { LeagueApiResponse } from '@infrastructure/types/poe-api.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';

const DEFAULT_THROTTLE_DELAY_MS = 2000;

export class PoeApiService implements ILeagueApi {
  constructor(
    private readonly client: HttpClient = new HttpClient(
      { throttleDelayMs: DEFAULT_THROTTLE_DELAY_MS },
    ),
  ) {}

  async fetchLeagues(): Promise<RawLeagueData[]> {
    const url = 'https://api.pathofexile.com/leagues';
    return this.client.get<LeagueApiResponse[]>(url, { type: 'main', compact: 0 });
  }
}
