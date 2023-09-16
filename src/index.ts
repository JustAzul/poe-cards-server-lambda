/* eslint-disable no-console */

import Fetch from './components/fetch';
import Database from './components/firestore';
import Utils from './components/utils';
import CARDS from './constants/cards';
import CURRENCY_CARDS from './constants/currency-cards';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

// const { GetLeagueOverview, Delay } = require('./components/utils');
// const Generators = require('./components/Generators');

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  const leaguesByName = Utils.FindLeagueResponseByName(
    await Fetch.LeaguesData(),
  );

  {
    const leaguesFound = [...leaguesByName.keys()];

    console.log(
      `Found ${leaguesByName.size} leagues: ${leaguesFound.join(', ')}.`,
    );
  }

  await Database.UpdateLeaguesDocument(leaguesByName);

  const leagueName = 'Kalandra';

  const leaguesOverview = await Fetch.LeaguesOverview([leagueName]);
  [...CARDS, ...CURRENCY_CARDS].forEach((card) => {
    try {
      const leagueOverview = leaguesOverview.get(leagueName);

      if (leagueOverview) {
        const findResult = Utils.FindCardOverview(
          leagueOverview,
          card,
          leagueName,
        );

        if (!findResult?.cardOverview || !findResult?.rewardOverview) {
          console.error(`failed to find result for ${card.cardName}`);
          console.log(findResult);
        }
      } else {
        console.error(`failed to find league overview for ${leagueName}`);
      }
    } catch (e) {
      console.error(
        // `failed to find result for ${card.Name}`,
        (e as Error).message,
      );
    }
  });

  /* const UpdatedAt = {};

  const GetLeagueData = async () => {
    const LeaguesData = Object.values(Leagues);

    const Results = {};

    for (let i = 0; i < LeaguesData.length; i += 1) {
      // @ts-ignore ignore
      const { leagueName } = LeaguesData[i];

      console.log(`Requesting league '${leagueName}' Overview..`);
      // @ts-ignore ignore
      Results[leagueName] = await GetLeagueOverview(leagueName);
      // @ts-ignore ignore
      UpdatedAt[leagueName] = new Date().toISOString();

      if (i !== (LeaguesData.length - 1)) await Delay(2);
    }

    return Results;
  };

  const LeagueDatas = await GetLeagueData();

  console.log('Generating tables and mapping results..');
  const TableResults = {};
  const CurrencyResults = {};

  {
    const Workload = [];

    const Keys = Object.keys(LeagueDatas);
    for (let i = 0; i < Keys.length; i += 1) {
      const leagueName = Keys[i];

      Workload.push(
        new Promise((resolve) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore ignore
          const Result = LeagueDatas[leagueName]
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore ignore
            .filter(({ currencyTypeName }) => !!currencyTypeName)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore ignore
            .map((Item) => ({
              Name: Item.currencyTypeName,
              detailsId: Item.detailsId,
              chaosEquivalent: Item.chaosEquivalent,
            }));

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore ignore
          CurrencyResults[leagueName] = Result;
          resolve(null);
        }),
      );

      Workload.push(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore ignore
        Generators.FlipTable(LeagueDatas[leagueName])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore ignore
          .then((Result) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore ignore
            TableResults[leagueName] = Result;
          }),
      );
    }

    await Promise.all(Workload);
  }

  {
    const UpdateDatabase = async (Data = {}) => {
      const LeagueItemsDoc = db.collection('items').doc('all');
      await LeagueItemsDoc.set(Data);
    };

    const UpdateCurrencyDatabase = async (Data = {}) => {
      const LeagueItemsDoc = db.collection('items').doc('currency');
      await LeagueItemsDoc.set(Data);
    };

    const UpdateLeagueDates = async (Data = {}) => {
      const LeagueItemsDoc = db.collection('items').doc('updated');
      await LeagueItemsDoc.set(Data);
    };

    console.log('Updating realtime database..');

    await Promise.all([
      UpdateDatabase(TableResults),
      UpdateCurrencyDatabase(CurrencyResults),
      UpdateLeagueDates(UpdatedAt),
    ]);
  } */
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
