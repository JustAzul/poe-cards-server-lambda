import {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../../application/ports/http-client.interface';
import GetHttpResponseWithExceptionUseCase from '../../../application/use-cases/get-http-response-with-exception.use-case';

import AxiosHttpClient from './axios-http-client';

export default class HttpClient implements IHttpClient {
  readonly client: IHttpClient;

  private readonly fetchUseCase: GetHttpResponseWithExceptionUseCase;

  constructor() {
    this.client = new AxiosHttpClient();

    this.fetchUseCase = new GetHttpResponseWithExceptionUseCase({
      interfaces: {
        httpClient: this.client,
      },
    });
  }

  get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>> {
    return this.fetchUseCase.execute<T>(props);
  }
}
