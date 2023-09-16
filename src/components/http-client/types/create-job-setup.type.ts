import type { AxiosRequestConfig } from 'axios';

export type CreateJobSetup = {
  config?: AxiosRequestConfig<never>;
  url: string;
};
