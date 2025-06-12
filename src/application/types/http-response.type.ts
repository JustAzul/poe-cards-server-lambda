import { HttpClientResponse } from 'application/ports/http-client.interface';

export type HttpResponse<T = unknown> = HttpClientResponse<T>;
