import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../ports/http-client.interface';

import ProcessLayerErrorUseCase from './process-layer-error.use-case';
import ValidateHttpResponseUseCase from './validate-http-response.use-case';

export type GetHttpResponseWithExceptionInterfaces = {
  httpClient: IHttpClient;
};

export type GetHttpResponseWithExceptionConstructor = {
  interfaces: GetHttpResponseWithExceptionInterfaces;
};

export default class GetHttpResponseWithExceptionUseCase {
  private readonly interfaces: GetHttpResponseWithExceptionInterfaces;

  constructor({
    interfaces,
  }: Readonly<GetHttpResponseWithExceptionConstructor>) {
    this.interfaces = interfaces;
  }

  async execute<T = unknown>(
    httpClientProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<T>> {
    const { httpClient } = this.interfaces;

    try {
      const httpClientResponse = await httpClient.get<T>(httpClientProps);

      new ValidateHttpResponseUseCase({
        request: httpClientProps,
        response: httpClientResponse,
      }).execute();

      return httpClientResponse;
    } catch (e: unknown) {
      throw new ProcessLayerErrorUseCase({
        sourceName: GetHttpResponseWithExceptionUseCase.name,
      }).execute(e);
    }
  }
}
