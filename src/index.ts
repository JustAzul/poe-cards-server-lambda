/* eslint-disable no-console */

import HttpClient from './infra/http-client';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  // TODO: fetch leagues from API

  const httpClient = new HttpClient();
}

const handler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback,
): Promise<void> => {
  try {
    await main();
    callback(null, {
      body: JSON.stringify('Job done.'),
      statusCode: 200,
    });
  } catch (e) {
    if (e instanceof Error) {
      callback(e, {
        body: JSON.stringify(e.message),
        statusCode: 500,
      });

      return;
    }

    callback(null, {
      body: JSON.stringify(e),
      statusCode: 500,
    });
  }
};

if (process.env.NODE_ENV === 'development') {
  process.nextTick(async () => main());
}

export { handler };
