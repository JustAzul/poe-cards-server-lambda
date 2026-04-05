/**
 * Utility functions shared across the application
 */

/**
 * Delays execution for a specified amount of time
 * @param delay - Time to sleep in milliseconds
 * @returns Promise that resolves after the specified delay
 */
export const sleep = (delay: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, delay);
});
