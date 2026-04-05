import { app } from '@infrastructure/composition-root';

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

const logger = console;

/**
 * Timeout buffer for Lambda execution.
 * Set below the configured Lambda timeout to allow graceful error reporting.
 */
const LAMBDA_TIMEOUT_MS = 15 * 60 * 1000;
const LAMBDA_TIMEOUT_BUFFER_MS = LAMBDA_TIMEOUT_MS - 60_000;

/**
 * Main orchestration function
 */
async function main(): Promise<{ processed: number; failed: number }> {
  return app.execute();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Execution timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

if (process.env.NODE_ENV === 'development') {
  main().catch((err) => logger.error(err));
}

export const handler = async (): Promise<LambdaResponse> => {
  try {
    const result = await withTimeout(main(), LAMBDA_TIMEOUT_BUFFER_MS);

    if (result.processed === 0 && result.failed > 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'All leagues failed', ...result }),
      };
    }

    const statusCode = result.failed > 0 ? 207 : 200;
    return {
      statusCode,
      body: JSON.stringify({ message: 'Job done.', ...result }),
    };
  } catch (error) {
    logger.error('Lambda execution failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const cause = error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : undefined;
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: message,
        ...(cause && { cause }),
      }),
    };
  }
};
