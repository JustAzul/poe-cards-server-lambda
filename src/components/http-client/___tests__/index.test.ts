import { IncomingHttpHeaders } from 'http';

import Fastify from 'fastify';
import StatusCode from 'status-code-enum';

import HttpClient from '..';

import type { FastifyInstance } from 'fastify';

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
};

describe(HttpClient.name, () => {
  const defaultServerResponse = { message: 'Hello World!' };

  let server: FastifyInstance;
  let address: string;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  afterEach(async () => server.close());
  beforeEach(async () => {
    receivedRequestData.clear();

    server = Fastify();
    server.get('/:status', async (req, response) => {
      const statusCodeToReply =
        (req.params as Record<'status', number>)?.status || 200;

      receivedRequestData.set(`get#${statusCodeToReply}`, {
        headers: req.headers,
      });

      await response.status(statusCodeToReply).send(defaultServerResponse);
    });

    address = await server.listen();
  });

  it('should throw HTTP Exception when the request fails', async () => {
    const httpClient = new HttpClient();

    const forceStatusCodes = Object.keys(StatusCode)
      .map(Number)
      .filter((code) => Boolean(code) && (code < 200 || code >= 300));

    const requests = forceStatusCodes.map(async (statusCode) => {
      try {
        await httpClient.get({
          url: `${address}/${statusCode}`,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    await Promise.all(requests);
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
      config: {
        headers,
      },
      url: `${address}/${forceStatusCode}`,
    });

    const httpServerResponse = receivedRequestData.get(
      `get#${forceStatusCode}`,
    );

    const hasHttpServerResponse = Boolean(httpServerResponse);
    const hasHttpClientResponse = Boolean(httpClientResponse);

    expect(hasHttpServerResponse).toBe(true);
    expect(hasHttpClientResponse).toBe(true);

    if (hasHttpServerResponse && hasHttpClientResponse) {
      expect(httpServerResponse?.headers).toMatchObject(headers);
    }

    expect(httpClientResponse?.data).toMatchObject(defaultServerResponse);
  });
});
