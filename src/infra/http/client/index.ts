import { IAsyncQueue } from '../../../application/ports/async-queue.interface';
import {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../../application/ports/http-client.interface';
import GetHttpResponseWithExceptionUseCase from '../../../application/use-cases/get-http-response-with-exception.use-case';

import AxiosHttpClient from './axios-http-client';

export default class HttpClient implements IHttpClient {
  readonly client: IHttpClient;

  private readonly queue: IAsyncQueue<HttpClientGetProps>;

  private readonly fetchUseCase: GetHttpResponseWithExceptionUseCase;

  constructor() {
    this.client = new AxiosHttpClient();
    // this.queue = new IAsyncQueue();

    this.fetchUseCase = new GetHttpResponseWithExceptionUseCase({
      interfaces: {
        httpClient: this.client,
      },
    });
  }

  async get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>> {
    const result = await this.queue.insertAndProcess<HttpClientResponse<T>>(
      async () => this.fetchUseCase.execute<T>(props),
    );

    return result;
  }
}
