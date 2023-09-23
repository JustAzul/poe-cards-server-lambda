import { IncomingHttpHeaders } from 'http';

import { HttpsAgent } from 'agentkeepalive';
import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';

import HttpException from '../application/exceptions/http.exception';
import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../application/ports/http-client.interface';

import InfraException from './exceptions/infra.exception';

const DEFAULT_REQUEST_TIMEOUT = 10000;

export default class HttpClient implements IHttpClient {
  private client: AxiosInstance;

  private cookies?: string;

  private defaultHeaders?: IncomingHttpHeaders;

  private readonly httpsAgent: HttpsAgent = new HttpsAgent();

  constructor() {
    this.client = Axios.create(this.getClientConstructor());
  }

  private getClientConstructor(): CreateAxiosDefaults {
    return {
      headers: this.getDefaultHeaders(),
      httpsAgent: this.getAgent(),
      responseType: 'json',
      timeout: DEFAULT_REQUEST_TIMEOUT,
      validateStatus: (statusCode) => statusCode >= 200 && statusCode < 300,
    };
  }

  private getAgent(): HttpsAgent {
    return this.httpsAgent;
  }

  private getDefaultHeaders(): IncomingHttpHeaders | undefined {
    if (this.cookies) {
      return {
        ...this.defaultHeaders,
        cookie: this.cookies,
      };
    }

    return this.defaultHeaders;
  }

  public setDefaultHeaders(headers: IncomingHttpHeaders): this {
    this.defaultHeaders = headers;
    return this;
  }

  public setDefaultCookies(cookies: string): this {
    this.cookies = cookies;
    return this;
  }

  public async get<T>(
    props: HttpClientGetProps,
  ): Promise<HttpClientResponse<T>> {
    const { url, headers } = props;

    const options: AxiosRequestConfig<never> = {
      headers,
    };

    try {
      const {
        data,
        headers: incomingHeaders,
        status,
      } = await this.client.get<T, AxiosResponse<T, never>, never>(
        url,
        options,
      );

      return {
        data,
        headers: incomingHeaders as IncomingHttpHeaders,
        statusCode: status,
      };
    } catch (e) {
      if (Axios.isAxiosError(e)) {
        throw new HttpException({
          message: e.message,
          request: props,
          response: {
            data: e.response?.data,
            headers: (e.response?.headers as IncomingHttpHeaders) || null,
            statusCode: e.response?.status,
          },
        });
      }

      if (e instanceof Error) {
        throw new InfraException(HttpClient.name, e.message);
      }

      throw new InfraException(HttpClient.name, `Unknown error: ${String(e)}`);
    }
  }
}