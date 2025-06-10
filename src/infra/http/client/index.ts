import { IAsyncQueue } from '../../../application/ports/async-queue.interface';
import {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../../application/ports/http-client.interface';
import SimpleAsyncQueue from '../../async-queue/simple-async-queue';

import AxiosHttpClient from './axios-http-client';

export default class HttpClient implements IHttpClient {
  readonly client: IHttpClient;

  private readonly queue: IAsyncQueue<HttpClientGetProps>;

  constructor() {
    this.client = new AxiosHttpClient();
    this.queue = new SimpleAsyncQueue<HttpClientGetProps>();
  }

  async get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>> {
    const result = await this.queue.insertAndProcess<HttpClientResponse<T>>(
      () => this.client.get<T>(props),
    );

    return result;
  }
}
