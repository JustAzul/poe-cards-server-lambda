import axios from 'axios';
import { FanOutService } from '@infrastructure/adapters/etl/fan-out.service';

jest.mock('axios');

const mockedAxiosPost = axios.post as jest.MockedFunction<typeof axios.post>;

function makeLogger() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe('FanOutService.notifyIndexUpdated', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('posts an empty body to REVALIDATE_URL with a bearer auth header from REVALIDATE_SECRET', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    process.env.REVALIDATE_SECRET = 'top-secret';
    mockedAxiosPost.mockResolvedValueOnce({});

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyIndexUpdated();

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://example.com/api/revalidate',
      {},
      { headers: { Authorization: 'Bearer top-secret' } },
    );
  });

  it('omits the Authorization header when REVALIDATE_SECRET is unset', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    delete process.env.REVALIDATE_SECRET;
    mockedAxiosPost.mockResolvedValueOnce({});

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyIndexUpdated();

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://example.com/api/revalidate',
      {},
      { headers: undefined },
    );
  });

  it('warns once and skips the request when REVALIDATE_URL is unset', async () => {
    delete process.env.REVALIDATE_URL;
    const logger = makeLogger();

    const fanOut = new FanOutService(logger);
    await fanOut.notifyIndexUpdated();
    await fanOut.notifyIndexUpdated();

    expect(mockedAxiosPost).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('retries once on failure, then logs and swallows the error instead of throwing', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    mockedAxiosPost.mockRejectedValue(new Error('network error'));
    const logger = makeLogger();

    const fanOut = new FanOutService(logger);
    await expect(fanOut.notifyIndexUpdated()).resolves.toBeUndefined();

    expect(mockedAxiosPost).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('revalidate for index update'));
  });
});
