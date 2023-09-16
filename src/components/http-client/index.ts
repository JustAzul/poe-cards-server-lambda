import EventEmitter from 'events';

import axios, { AxiosResponse } from 'axios';

import USER_AGENT from '../../constants/user-agent';

import HttpClientUtils from './utils';

import type { CreateJobSetup } from './types/create-job-setup.type';
import type { JobQueue } from './types/job-queue.type';
import type { JobResponse } from './types/job-response.type';

export default class HttpClient {
  private readonly queue: JobQueue<JobResponse>[] = [];

  private readonly delayBetweenJobs: number;

  private readonly events: EventEmitter = new EventEmitter();

  private isQueueBeingProcessed = false;

  private readonly userAgent = USER_AGENT;

  constructor(delayBetweenJobs?: number) {
    this.delayBetweenJobs = delayBetweenJobs || 0;
  }

  private async processQueue(): Promise<void> {
    if (this.isQueueBeingProcessed) return;
    this.isQueueBeingProcessed = true;

    const currentJob = this.queue.shift();
    if (currentJob) {
      try {
        const result = await currentJob.job();
        this.events.emit(currentJob.id, null, result);
      } catch (error) {
        this.events.emit(currentJob.id, error, null);
      }
    }

    this.isQueueBeingProcessed = false;
    if (this.queue.length > 0) {
      setTimeout(() => {
        this.processQueue().catch((error: Error) => {
          console.error(`Error in processQueue: ${error.message}`);
        });
      }, this.delayBetweenJobs);
    }
  }

  private insertAndProcess<T>(jobQueue: JobQueue<JobResponse<T>>) {
    this.queue.push(jobQueue);

    if (!this.isQueueBeingProcessed) {
      this.processQueue().catch((error: Error) =>
        console.error(
          `Error in insertAndProcess job #${jobQueue.id.toString()}: ${
            error.message
          }`,
        ),
      );
    }
  }

  private createJob<T>({
    url,
    config,
  }: CreateJobSetup): JobQueue<JobResponse<T>> {
    const newJob: JobQueue<JobResponse<T>> = {
      id: Symbol(url),
      job: async () =>
        axios.get<T, JobResponse<T>>(
          url,
          HttpClientUtils.mergeConfig(this.userAgent, config),
        ),
    };

    return newJob;
  }

  async get<T>(jobSetup: CreateJobSetup): Promise<AxiosResponse<T>> {
    const jobQueue = this.createJob<T>(jobSetup);

    return new Promise((resolve, reject) => {
      const listener = (error: Error, result: AxiosResponse<T>) => {
        this.events.off(jobQueue.id, listener); // Remove the event listener to prevent memory leaks

        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };

      this.events.once(jobQueue.id, listener);
      this.insertAndProcess(jobQueue);
    });
  }
}
