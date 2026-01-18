// Use-cases
import { processLeaguesDataUseCase } from '@application/use-cases/process-leagues-data.use-case';

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Main orchestration function - delegates to use-case
 */
async function main(): Promise<void> {
  await processLeaguesDataUseCase.execute();
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
