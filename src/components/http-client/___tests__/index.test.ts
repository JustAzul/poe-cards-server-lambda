import Fastify, { FastifyInstance } from 'fastify';
import StatusCode from 'status-code-enum';
import { v4 as uuidv4 } from 'uuid';

import HttpClient from '..';
// import { CreateJobSetup } from '../types/create-job-setup.type';

import type { IncomingHttpHeaders } from 'http';

function getUID(s: string = ''): string {
  const uid = uuidv4();
  return `${s.trim().toLowerCase()}-${uid}`;
}

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
  timestamp: number;
};

describe(HttpClient.name, () => {
  const jsonServerResponse: Record<string, unknown> = {
    message: 'Hello World!',
  };

  // const delayBetweenJobs = parseInt((Math.random() * 1000).toFixed(), 10);

  let server: FastifyInstance | null;
  let address: string | null;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  // beforeAll(() => {
  //   jest.useFakeTimers();
  // });

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

    server.get('/:status/:uid', async ({ params, headers }, response) => {
      const { status = '200', uid = getUID() } = params as Record<
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

      const url = `${address}/${statusCode}/${uid}`;

      const httpClientResponse = await httpClient.get<
        typeof jsonServerResponse
      >({
        url,
      });

      expect(httpClientResponse?.data).toMatchObject(jsonServerResponse);
    });
  }

  // {
  //   const shouldTest =
  //     'should handle multiple requests correctly, respecting the delay between jobs';

  //   it(shouldTest, async () => {
  //     const httpClient = new HttpClient(delayBetweenJobs);

  //     // const startTime = Date.now();

  //     const internalUIDs: string[] = [];

  //     // Send multiple requests in quick succession
  //     const randomNumberOfRequests = Math.floor(Math.random() * 10) + 1;
  //     const requests = new Array(randomNumberOfRequests)
  //       .fill(null)
  //       .map((_, i) => {
  //         const statusCode = StatusCode.SuccessOK;

  //         const uid = getUID(`${shouldTest}-${i}`);
  //         internalUIDs.push(uid);

  //         const config: CreateJobSetup = {
  //           url: `${address}/${statusCode}/${uid}`,
  //         };

  //         return () => httpClient.get<typeof jsonServerResponse>(config);
  //       });

  //     for (let i = 0; i < requests.length; i += 1) {
  //       // eslint-disable-next-line no-await-in-loop
  //       console.log('i', i);
  //       // eslint-disable-next-line no-await-in-loop
  //       await Promise.all([
  //         jest.advanceTimersByTime(delayBetweenJobs),
  //         requests[i](),
  //       ]);
  //     }

  //     console.log('internalUIDs', internalUIDs);
  //   });
  // }

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

      const url = `${address}/${statusCode}/${uid}`;

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
