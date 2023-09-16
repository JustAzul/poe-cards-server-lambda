import { AxiosRequestConfig } from 'axios';

import HttpClientUtils from '../utils';

describe('HttpClientUtils', () => {
  // Common variables for the test suite
  let userAgent: string;

  beforeEach(() => {
    userAgent = 'testUserAgent';
  });

  describe('mergeConfig', () => {
    // Default behavior
    it('returns default headers when no config is provided', () => {
      const expected = {
        headers: {
          'user-agent': userAgent,
        },
      };

      const result = HttpClientUtils.mergeConfig(userAgent);

      expect(result).toEqual(expected);
    });

    // Config with headers
    it('merges default headers with config headers', () => {
      const customHeaders = {
        'custom-header': 'customValue',
      };
      const config = {
        headers: customHeaders,
        otherConfig: 'otherValue',
      };
      const expected = {
        ...config,
        headers: {
          'user-agent': userAgent,
          ...customHeaders,
        },
      };

      const result = HttpClientUtils.mergeConfig(userAgent, config);

      expect(result).toEqual(expected);
    });

    // Config without headers
    it('combines default headers with config when config lacks headers', () => {
      const config = {
        otherConfig: 'otherValue',
      };
      const expected = {
        headers: {
          'user-agent': userAgent,
        },
        ...config,
      };

      const result = HttpClientUtils.mergeConfig(
        userAgent,
        config as AxiosRequestConfig<never>,
      );

      expect(result).toEqual(expected);
    });
  });
});
