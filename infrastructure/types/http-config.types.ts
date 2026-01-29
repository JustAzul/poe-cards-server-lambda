// HTTP Client Configuration
export interface HttpConfig {
  throttleDelayMs?: number; // Delay between requests in milliseconds (default: 2000)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  retryDelayMs?: number; // Base delay for retry backoff in milliseconds (default: 2000)
  exponentialBackoff?: boolean; // Use exponential backoff (default: true)
}
