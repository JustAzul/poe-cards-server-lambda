import type { AxiosResponse } from 'axios';

export type JobResponse<T = unknown> = AxiosResponse<T, never>;
