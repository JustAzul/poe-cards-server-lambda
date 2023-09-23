import { IncomingHttpHeaders } from 'http';

import StatusCode from 'status-code-enum';

export type HttpClientResponse<T> = {
  data: T | null;
  headers: IncomingHttpHeaders;
  statusCode: StatusCode;
};

export type HttpClientGetProps = {
  headers?: IncomingHttpHeaders;
  url: string;
};

export interface IHttpClient {
  get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>>;
}
