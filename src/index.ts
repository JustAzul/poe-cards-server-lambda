import { app } from '@infrastructure/composition-root';

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Main orchestration function
 */
async function main(): Promise<void> {
  await app.execute();
}

if (process.env.NODE_ENV === 'development') {
  main().catch(console.error);
}

export const handler = async (): Promise<LambdaResponse> => {
  try {
    await main();
    return { statusCode: 200, body: JSON.stringify('Job done.') };
  } catch (error) {
    console.error('Lambda execution failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
