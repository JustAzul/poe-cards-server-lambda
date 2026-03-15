import { app } from '@infrastructure/composition-root';

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Main orchestration function
 */
async function main(): Promise<{ processed: number; failed: number }> {
  return app.execute();
}

if (process.env.NODE_ENV === 'development') {
  main().catch(console.error);
}

export const handler = async (): Promise<LambdaResponse> => {
  try {
    const result = await main();

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
    console.error('Lambda execution failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
