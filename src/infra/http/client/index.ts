import {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../../application/ports/http-client.interface';
import FetchWithDelayUseCase from '../../../application/use-cases/fetch-with-delay.use-case';
import GetHttpResponseWithExceptionUseCase from '../../../application/use-cases/get-http-response-with-exception.use-case';

import AxiosHttpClient from './axios-http-client';
import { DEFAULT_DELAY_IN_MILLISECONDS } from './constants';

export default class HttpClient implements IHttpClient {
  readonly client: IHttpClient;

  private readonly useCase: GetHttpResponseWithExceptionUseCase;

  constructor() {
    this.client = new AxiosHttpClient();

    const fetchWithDelay = new FetchWithDelayUseCase({
      interfaces: { httpClient: this.client },
      props: { delayInMilliseconds: DEFAULT_DELAY_IN_MILLISECONDS },
    });

    this.useCase = new GetHttpResponseWithExceptionUseCase({
      interfaces: {
        fetchUrlUseCase: fetchWithDelay,
      },
    });
  }

  get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>> {
    return this.useCase.execute<T>(props);
  }
}
