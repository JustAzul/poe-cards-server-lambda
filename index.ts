// Use-cases
import { app } from '@infrastructure/app';

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
  process.nextTick(async (): Promise<void> => {
    await main();
  });
}

// eslint-disable-next-line import/prefer-default-export
export const handler = async (): Promise<LambdaResponse> => {
  await main();

  const response: LambdaResponse = {
    statusCode: 200,
    body: JSON.stringify('Job done.'),
  };

  return response;
};
