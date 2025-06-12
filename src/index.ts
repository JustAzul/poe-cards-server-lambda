/* eslint-disable no-console */

import FindLeaguesUseCase from 'application/use-cases/find-leagues.use-case';
import HttpClient from 'infra/http/client';
import HttpLeagueRepository from 'infra/http/league/league.repository';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  const httpClient = new HttpClient();

  const leagueRepository = new HttpLeagueRepository(httpClient);
  const findLeaguesUseCase = new FindLeaguesUseCase({
    interfaces: {
      leagueRepository,
    },
  });

  const leagueEntities = await findLeaguesUseCase.execute();
  console.log(leagueEntities);
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
