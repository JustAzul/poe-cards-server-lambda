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

describe('FanOutService.notifyLeagueUpdated', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('posts to both revalidate and broadcast when both URLs are set', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    process.env.BROADCAST_URL = 'https://example.com/api/broadcast';
    mockedAxiosPost.mockResolvedValue({});

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyLeagueUpdated('Standard');

    expect(mockedAxiosPost).toHaveBeenCalledTimes(2);
    expect(mockedAxiosPost).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/revalidate',
      { leagueName: 'Standard' },
      { headers: undefined },
    );
    expect(mockedAxiosPost).toHaveBeenNthCalledWith(
      2,
      'https://example.com/api/broadcast/Standard',
      { leagueName: 'Standard' },
      { headers: undefined },
    );
  });

  it('still broadcasts when only BROADCAST_URL is set (REVALIDATE_URL unset)', async () => {
    delete process.env.REVALIDATE_URL;
    process.env.BROADCAST_URL = 'https://example.com/api/broadcast';
    mockedAxiosPost.mockResolvedValue({});

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyLeagueUpdated('Standard');

    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://example.com/api/broadcast/Standard',
      { leagueName: 'Standard' },
      { headers: undefined },
    );
  });

  it('still revalidates when only REVALIDATE_URL is set (BROADCAST_URL unset)', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    delete process.env.BROADCAST_URL;
    mockedAxiosPost.mockResolvedValue({});

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyLeagueUpdated('Standard');

    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://example.com/api/revalidate',
      { leagueName: 'Standard' },
      { headers: undefined },
    );
  });

  it('warns once and skips both requests when neither URL is set', async () => {
    delete process.env.REVALIDATE_URL;
    delete process.env.BROADCAST_URL;
    const logger = makeLogger();

    const fanOut = new FanOutService(logger);
    await fanOut.notifyLeagueUpdated('Standard');
    await fanOut.notifyLeagueUpdated('Standard');

    expect(mockedAxiosPost).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('skips broadcast when revalidate fails after retries', async () => {
    process.env.REVALIDATE_URL = 'https://example.com/api/revalidate';
    process.env.BROADCAST_URL = 'https://example.com/api/broadcast';
    mockedAxiosPost.mockRejectedValue(new Error('network error'));

    const fanOut = new FanOutService(makeLogger());
    await fanOut.notifyLeagueUpdated('Standard');

    expect(mockedAxiosPost).toHaveBeenCalledTimes(2);
    expect(mockedAxiosPost).not.toHaveBeenCalledWith(
      expect.stringContaining('broadcast'),
      expect.anything(),
      expect.anything(),
    );
  });
});
