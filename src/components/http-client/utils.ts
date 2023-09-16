import type { CreateJobSetup } from './types/create-job-setup.type';
import type { RawAxiosRequestHeaders } from 'axios';

export default class HttpClientUtils {
  static mergeConfig(userAgent: string, config?: CreateJobSetup['config']) {
    const defaultHeaders: RawAxiosRequestHeaders = {
      'user-agent': userAgent,
    };

    const hasNotReceivedConfig = !config;
    if (hasNotReceivedConfig) {
      return {
        headers: defaultHeaders,
      };
    }

    if ('headers' in config) {
      return {
        ...config,
        headers: {
          ...defaultHeaders,
          ...config.headers,
        },
      };
    }

    return {
      headers: {
        'user-agent': userAgent,
      },
      ...config,
    };
  }
}
