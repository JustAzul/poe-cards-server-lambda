import { randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http';

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import StatusCode from 'status-code-enum';

import HttpClient from '..';
import HttpException from '../../../../application/exceptions/http.exception';
import { DEFAULT_USER_AGENT } from '../constants';

jest.setTimeout(30000);

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
};

interface TestServer {
  get: (
    path: string,
    handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void> | void,
  ) => void;
  listen: (opts: { host: string; port: number }) => Promise<string>;
  close: () => Promise<void>;
}

describe(HttpClient.name, () => {
  const defaultServerResponse = { message: 'Hello World!' };
  const server = Fastify() as unknown as TestServer;
  let address: string | null = null;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  beforeAll(async () => {
    server.get('/:status', async (req: FastifyRequest, response: FastifyReply) => {
      const statusCodeToReply =
        (req.params as Record<'status', number>)?.status || 200;

      const requestUID = randomUUID();
      receivedRequestData.set(requestUID, {
        headers: req.headers,
      });

      await response
        .status(statusCodeToReply)
        .header('x-request-id', requestUID)
        .send(defaultServerResponse);
    });

    address = await server.listen({ host: '127.0.0.1', port: 0 });
  });

  afterAll(async () => server.close());
  beforeEach(() => receivedRequestData.clear());

  it('should throw HTTP Exception when the request fails', async () => {
    const { client: httpClient } = new HttpClient();

    const forceStatusCodes = Object.keys(StatusCode)
      .map(Number)
      .filter((code) => code < 200 || code >= 300);

    const tests: Promise<void>[] = [];
    forceStatusCodes.forEach((statusCode) => {
      const test = httpClient
        .get({
          url: `${address}/${statusCode}`,
        })
        .then(() => {})
        .catch((e) => {
          expect(e).toBeInstanceOf(HttpException);
        });
      tests.push(test);
    });

    await Promise.all(tests);
  });

  it('should setup default user-agent header', async () => {
    const { client: httpClient } = new HttpClient();

    const forceStatusCode = StatusCode.SuccessOK;

    const httpClientResponse = await httpClient.get<
      typeof defaultServerResponse
    >({
      url: `${address}/${forceStatusCode}`,
    });

    const requestUID = httpClientResponse?.headers['x-request-id'] as string;
    const httpRequest = receivedRequestData.get(requestUID);

    const hasFoundHttpRequest = Boolean(httpRequest);
    expect(hasFoundHttpRequest).toBe(true);

    if (hasFoundHttpRequest) {
      // @ts-expect-error - We know that the header exists
      const userAgent = httpRequest.headers['user-agent'];

      expect(userAgent).toBeDefined();
      expect(userAgent).toBe(DEFAULT_USER_AGENT);
    }
  });

  it('should send the request with the correct headers', async () => {
    const { client: httpClient } = new HttpClient();

    const headers = {
      'x-custom-header': 'custom-header-value',
    };

    const forceStatusCode = StatusCode.SuccessOK;

    const httpClientResponse = await httpClient.get<
      typeof defaultServerResponse
    >({
      headers,
      url: `${address}/${forceStatusCode}`,
    });

    const requestUID = httpClientResponse?.headers['x-request-id'] as string;
    const httpRequest = receivedRequestData.get(requestUID);

    const hasFoundHttpRequest = Boolean(httpRequest);
    const hasHttpClientResponse = Boolean(httpClientResponse);

    expect(hasFoundHttpRequest).toBe(true);
    expect(hasHttpClientResponse).toBe(true);

    if (hasFoundHttpRequest && hasHttpClientResponse) {
      expect(httpRequest?.headers).toMatchObject(headers);
    }

    expect(httpClientResponse?.data).toMatchObject(defaultServerResponse);
  });
});
