import { randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http';

import Fastify from 'fastify';
import StatusCode from 'status-code-enum';

import HttpException from '../../application/exceptions/http.exception';
import HttpClient from '../http-client';

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
};

describe(HttpClient.name, () => {
  const defaultServerResponse = { message: 'Hello World!' };
  const server = Fastify();
  let address: string | null = null;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  beforeAll(async () => {
    server.get('/:status', async (req, response) => {
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

    address = await server.listen();
  });

  afterAll(async () => server.close());
  beforeEach(() => receivedRequestData.clear());

  it('should throw HTTP Exception when the request fails', async () => {
    const httpClient = new HttpClient();

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

  it('should send the request with the correct headers', async () => {
    const httpClient = new HttpClient();

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