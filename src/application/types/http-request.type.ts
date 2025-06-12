import { HttpClientGetProps } from 'application/ports/http-client.interface';

export type HttpRequest = Pick<HttpClientGetProps, 'url' | 'headers'>;
