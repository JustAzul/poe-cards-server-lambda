import { IHttpClient } from '../../../application/ports/http-client.interface';
import ValidateHttpResponseUseCase from '../../../application/use-cases/validate-http-response.use-case';
import sleep from '../../../shared/helpers/sleep.helper';
import InfraException from '../../exceptions/infra.exception';

export type PoeNinjaQueryParams = {
  language?: string;
  league: string;
  type: string;
};

export default class PoeNinjaService {
  private readonly httpClient: IHttpClient;

  private readonly baseURL: string;

  constructor(httpClient: IHttpClient, baseURL = 'https://poe.ninja/api/data') {
    this.httpClient = httpClient;
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  private buildURL(endpoint: string, params: PoeNinjaQueryParams): string {
    const searchParams = new URLSearchParams({
      language: params.language ?? 'en',
      league: params.league,
      type: params.type,
    });

    return `${this.baseURL}/${endpoint}?${searchParams.toString()}`;
  }

  private async requestWithRetry<T>(
    url: string,
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    try {
      const response = await this.httpClient.get<T>({ url });
      ValidateHttpResponseUseCase.execute({
        request: { url },
        response,
      });

      if (!response.data) {
        throw new InfraException(PoeNinjaService.name, 'No data returned');
      }

      return response.data;
    } catch (e) {
      if (retries <= 1) {
        throw e;
      }

      await sleep(delay);
      return this.requestWithRetry(url, retries - 1, delay * 2);
    }
  }

  async fetchItemOverview<T>(params: PoeNinjaQueryParams): Promise<T> {
    const url = this.buildURL('itemoverview', params);
    return this.requestWithRetry<T>(url);
  }

  async fetchCurrencyOverview<T>(params: PoeNinjaQueryParams): Promise<T> {
    const url = this.buildURL('currencyoverview', params);
    return this.requestWithRetry<T>(url);
  }
}
