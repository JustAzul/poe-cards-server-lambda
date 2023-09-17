import Fastify, { FastifyInstance } from 'fastify';
import StatusCode from 'status-code-enum';
import { v4 as uuidv4 } from 'uuid';

import HttpClient from '..';
import { CreateJobSetup } from '../types/create-job-setup.type';

import type { IncomingHttpHeaders } from 'http';

function getUID(s: string = ''): string {
  const uid = uuidv4();
  return `${s.trim().toLowerCase()}-${uid}`;
}

function getURL(base: string, searchQuery: Record<string, string>): string {
  const searchParams = new URLSearchParams();

  const keys = Object.keys(searchQuery);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = searchQuery[key];

    searchParams.set(key, value);
  }

  return `${base}?${searchParams.toString()}`;
}

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
  timestamp: number;
};

describe(HttpClient.name, () => {
  const jsonServerResponse: Record<string, unknown> = {
    message: 'Hello World!',
  };

  let server: FastifyInstance | null;
  let address: string | null;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  beforeAll(() => {
    // jest.useFakeTimers();
  });

  afterEach(async () => {
    if (server) {
      await server.close().then(() => {
        server = null;
        address = null;
      });
    }

    // jest.clearAllTimers();
  });

  beforeEach(async () => {
    receivedRequestData.clear();

    server = Fastify();
    server.get('/', async ({ headers, query }, response) => {
      const { status = '200', uid = getUID() } = query as Record<
        'status' | 'uid',
        string
      >;

      receivedRequestData.set(uid, {
        headers,
        timestamp: Date.now(),
      });

      const statusCodeToReply = Number(status);
      await response.status(statusCodeToReply).send(jsonServerResponse);
    });

    address = await server.listen();
    await server.ready();
  });

  {
    const shouldTest = 'should handle successful requests correctly';
    it(shouldTest, async () => {
      const httpClient = new HttpClient();

      const statusCode = StatusCode.SuccessOK;
      const uid = getUID(shouldTest);

      if (!address) {
        throw new Error('Address is not defined');
      }

      const url = getURL(address, {
        status: statusCode.toString(),
        uid,
      });

      const httpClientResponse = await httpClient.get<
        typeof jsonServerResponse
      >({
        url,
      });

      expect(httpClientResponse?.data).toMatchObject(jsonServerResponse);
    });
  }

  {
    const shouldTest =
      'should handle multiple requests correctly, respecting the delay between jobs';

    it(shouldTest, async () => {
      const delayBetweenJobs = parseInt((Math.random() * 1000).toFixed(), 10);
      const httpClient = new HttpClient(delayBetweenJobs);

      const statusCode = StatusCode.SuccessOK;
      const uid = getUID(shouldTest);

      if (!address) {
        throw new Error('Address is not defined');
      }

      const url = getURL(address, {
        status: statusCode.toString(),
        uid,
      });

      const config: CreateJobSetup = {
        url,
      };

      // first request has no delay
      const firstResponse = await httpClient.get<typeof jsonServerResponse>({
        url,
      });

      expect(firstResponse?.data).toMatchObject(jsonServerResponse);

      // subsequent requests have a delay
      const requestTimes: number[] = [];

      const numRequests = parseInt((Math.random() * 10).toFixed(), 10);
      const requests = Array.from({ length: numRequests }).map(async () => {
        const start = Date.now();
        const response = await httpClient.get<typeof jsonServerResponse>(
          config,
        );
        const end = Date.now();

        requestTimes.push(end - start);
        return response?.data;
      });

      const responses = await Promise.all(requests);

      // Check that all responses are as expected
      responses.forEach((response) => {
        expect(response).toMatchObject(jsonServerResponse);
      });

      // Check if the time difference between each request is at least `delayBetweenJobs`
      for (let i = 1; i < requestTimes.length; i += 1) {
        expect(requestTimes[i]).toBeGreaterThanOrEqual(delayBetweenJobs);
      }

      receivedRequestData.forEach(({ timestamp }) => {
        // console.log(new Date(timestamp));
        expect(timestamp).toBeLessThanOrEqual(Date.now());
      });
    });
  }

  {
    const shouldTest = 'should throw HTTP Exception when the request fails';
    it(shouldTest, async () => {
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
  }

  {
    const shouldTest = 'should send the request with the correct headers';
    it(shouldTest, async () => {
      const httpClient = new HttpClient();

      const headers = {
        'x-custom-header': 'custom-header-value',
      };

      const statusCode = StatusCode.SuccessOK;
      const uid = getUID(shouldTest);

      if (!address) {
        throw new Error('Address is not defined');
      }

      const url = getURL(address, {
        status: statusCode.toString(),
        uid,
      });

      const httpClientResponse = await httpClient.get<
        typeof jsonServerResponse
      >({
        config: {
          headers,
        },
        url,
      });

      const httpServerResponse = receivedRequestData.get(uid);

      const hasHttpServerResponse = Boolean(httpServerResponse);
      const hasHttpClientResponse = Boolean(httpClientResponse);

      expect(hasHttpServerResponse).toBe(true);
      expect(hasHttpClientResponse).toBe(true);

      if (hasHttpServerResponse && hasHttpClientResponse) {
        expect(httpServerResponse?.headers).toMatchObject(headers);
      }

      expect(httpClientResponse?.data).toMatchObject(jsonServerResponse);
    });
  }
});
