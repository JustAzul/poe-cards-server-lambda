import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../ports/http-client.interface';

export default class FetchUrlUseCase {
  private httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  execute<ResponseType>(
    props: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<ResponseType>> {
    return this.httpClient.get<ResponseType>(props);
  }
}
