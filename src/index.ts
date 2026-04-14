import { app, store, compositionLogger as logger } from '@infrastructure/composition-root';
import { createHttpServer } from '@runtime/http-server';
import { EtlRuntime } from '@runtime/etl-runtime';

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

const LAMBDA_TIMEOUT_MS = 15 * 60 * 1000;
const LAMBDA_TIMEOUT_BUFFER_MS = LAMBDA_TIMEOUT_MS - 60_000;
const ETL_MODE = process.env.ETL_MODE ?? 'job';
const HTTP_PORT = Number(process.env.PORT ?? 3002);

const runtime = new EtlRuntime(app, store, logger);

async function main(): Promise<{ processed: number; failed: number }> {
  return runtime.refresh();
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

async function startHttpMode(): Promise<void> {
  const httpServer = createHttpServer(runtime, logger);

  httpServer.listen(HTTP_PORT, () => {
    logger.log(`ETL HTTP server listening on port ${HTTP_PORT}`);
  });

  if (runtime.isDatabaseEmpty()) {
    logger.log('SQLite database is empty, running initial seed...');
    runtime.refresh().catch((error: unknown) => {
      logger.error('Initial ETL seed failed:', error);
    });
  }
}

if (ETL_MODE === 'http') {
  startHttpMode().catch((error: unknown) => logger.error('Failed to start ETL HTTP mode:', error));
} else if (process.env.NODE_ENV === 'development') {
  main().catch((error: unknown) => logger.error(error));
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
  } catch (error: unknown) {
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
