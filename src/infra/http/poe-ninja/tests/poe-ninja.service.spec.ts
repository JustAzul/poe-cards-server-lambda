/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import StatusCode from 'status-code-enum';

import PoeNinjaService from '..';

import type {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../../../application/ports/http-client.interface';

jest.useFakeTimers();

describe(PoeNinjaService.name, () => {
  it('should retry the request on failure', async () => {
    const responses: Array<
      HttpClientResponse<{ lines: Array<{ ok: boolean }> }>
    > = [
      { data: null, headers: {}, statusCode: StatusCode.ServerErrorInternal },
      {
        data: { lines: [{ ok: true }] },
        headers: {},
        statusCode: StatusCode.SuccessOK,
      },
    ];

    const getMock = jest
      .fn<
        Promise<HttpClientResponse<{ lines: Array<{ ok: boolean }> }>>,
        [HttpClientGetProps]
      >()
      .mockImplementation(() =>
        Promise.resolve(responses.shift()!),
      ) as unknown as IHttpClient['get'];

    const fakeHttpClient: IHttpClient = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      get: getMock,
    };

    const service = new PoeNinjaService(fakeHttpClient, 'http://localhost');

    const promise = service.fetchItemOverview({ league: 'Test', type: 'Map' });
    await Promise.all([promise, jest.runAllTimersAsync()]);
    const result = await promise;

    expect(getMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ lines: [{ ok: true }] });
  });
});
