import sleep from '../../shared/helpers/sleep.helper';
import HttpException from '../exceptions/http.exception';
import UseCaseException from '../exceptions/use-case.exception';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';

import FetchUrlUseCase from './fetch-url.use-case';
import FetchWithDelayUseCase from './fetch-with-delay.use-case';
import ValidateHttpResponseUseCase from './validate-http-response.use-case';

const DEFAULT_REQUEST_RETRY_DELAY = 1000;
const DEFAULT_REQUEST_MAX_RETRIES = 3;

export type GetHttpResponseWithExceptionProps = {
  maxRetries?: number;
};

export type GetHttpResponseWithExceptionInterfaces = {
  fetchUrlUseCase: FetchUrlUseCase | FetchWithDelayUseCase;
};

export type GetHttpResponseWithExceptionConstructor = {
  interfaces: GetHttpResponseWithExceptionInterfaces;
  props: GetHttpResponseWithExceptionProps;
};

export default class GetHttpResponseWithExceptionUseCase {
  private executeCount: number;

  private readonly interfaces: GetHttpResponseWithExceptionInterfaces;

  private readonly props: GetHttpResponseWithExceptionProps;

  public constructor({
    interfaces,
    props,
  }: Readonly<GetHttpResponseWithExceptionConstructor>) {
    this.executeCount = 0;

    this.interfaces = interfaces;
    this.props = props;
  }

  public async execute<T = unknown>(
    httpClientProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<T>> {
    this.executeCount += 1;

    const { fetchUrlUseCase } = this.interfaces;

    let httpClientResponse: HttpClientResponse<T>;

    try {
      httpClientResponse = await fetchUrlUseCase.execute<T>(httpClientProps);
    } catch (e) {
      if (e instanceof HttpException) {
        if (this.canRetry()) {
          await sleep(DEFAULT_REQUEST_RETRY_DELAY);
          return this.execute(httpClientProps);
        }
      }

      if (Object.prototype.hasOwnProperty.call(e, 'message')) {
        const { message } = e as Error;

        throw new UseCaseException(
          GetHttpResponseWithExceptionUseCase.name,
          `${typeof e}: ${message}`,
        );
      }

      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        `Unknown Error: ${String(e)}`,
      );
    }

    try {
      const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
        request: httpClientProps,
        response: httpClientResponse,
      });

      const response = validateHttpResponseUseCase.execute();
      return response;
    } catch (e) {
      if (this.canRetry()) {
        await sleep(DEFAULT_REQUEST_RETRY_DELAY);
        return this.execute(httpClientProps);
      }

      if (Object.prototype.hasOwnProperty.call(e, 'message')) {
        const { message } = e as Error;

        throw new UseCaseException(
          GetHttpResponseWithExceptionUseCase.name,
          `${typeof e}: ${message}`,
        );
      }

      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        `Unknown Error: ${String(e)}`,
      );
    }
  }

  private canRetry(): boolean {
    const { maxRetries = DEFAULT_REQUEST_MAX_RETRIES } = this.props;
    return this.executeCount <= maxRetries;
  }
}
