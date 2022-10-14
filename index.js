/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
// eslint-disable-next-line import/no-unresolved
const { initializeApp, /* applicationDefault, */ cert } = require('firebase-admin/app');
// eslint-disable-next-line import/no-unresolved
const { getFirestore/* , Timestamp, FieldValue */ } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const { GetLeagueOverview, Delay } = require('./components/utils');
const { LeaguesOverview } = require('./components/Fetch');
const Generators = require('./components/Generators');

dotenv.config();

async function main() {
  {
    const credential = cert({
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      project_id: process.env.FIREBASE_PROJECT_ID,
    });
    const AppOptions = {
      credential,
    };

    initializeApp(AppOptions);
  }

  const db = getFirestore();

  console.log('Fetching Leagues..');
  const Leagues = await LeaguesOverview();
  console.log(`Found ${Object.keys(Leagues).length} leagues!`);

  const UpdateLeagueList = async () => {
    const LeaguesDoc = db.collection('leagues').doc('all');
    console.log('Updating leagues realtime database..');
    await LeaguesDoc.set(Leagues);
  };

  await UpdateLeagueList();

  const UpdatedAt = {};

  const GetLeagueData = async () => {
    const LeaguesData = Object.values(Leagues);

    const Results = {};

    for (let i = 0; i < LeaguesData.length; i += 1) {
      const { leagueName } = LeaguesData[i];

      console.log(`Requesting league '${leagueName}' Overview..`);
      Results[leagueName] = await GetLeagueOverview(leagueName);
      UpdatedAt[leagueName] = new Date().toISOString();

      if (i !== (LeaguesData.length - 1)) await Delay(2);
    }

    return Results;
  };

  const LeagueDatas = await GetLeagueData();

  console.log('Generating tables and maping results..');
  const TableResults = {};
  const CurrencyResults = {};

  {
    const Workload = [];

    const Keys = Object.keys(LeagueDatas);
    for (let i = 0; i < Keys.length; i += 1) {
      const leagueName = Keys[i];

      Workload.push(
        new Promise((resolve) => {
          const Result = LeagueDatas[leagueName]
            .filter(({ currencyTypeName }) => !!currencyTypeName)
            .map((Item) => ({
              Name: Item.currencyTypeName,
              detailsId: Item.detailsId,
              chaosEquivalent: Item.chaosEquivalent,
            }));

          CurrencyResults[leagueName] = Result;
          resolve();
        }),
      );

      Workload.push(
        Generators.FlipTable(LeagueDatas[leagueName])
          .then((Result) => {
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
  }
}

exports.handler = async () => {
  await main();

  const response = {
    statusCode: 200,
    body: JSON.stringify('Job done.'),
  };

  return response;
};
