/* eslint-disable import/prefer-default-export */
/**
 * Utility functions shared across the application
 */

import { Duration } from 'moment';

/**
 * Delays execution for a specified amount of time
 * @param delay - Time to sleep in milliseconds, or a moment Duration object
 * @returns Promise that resolves after the specified delay
 */
export const sleep = (delay: number | Duration): Promise<void> => {
  const ms = typeof delay === 'number' ? delay : delay.asMilliseconds();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
