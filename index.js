const { GetLeagueOverview, Delay } = require('./components/utils');
const { LeaguesOverview } = require('./components/Fetch');
const Generators = require('./components/Generators');
const firestore = require('./components/firestore');

async function main() {
  console.log('Fetching Leagues..');
  const Leagues = await LeaguesOverview();
  console.log(`Found ${Object.keys(Leagues).length} leagues!`);

  const UpdateLeagueList = async () => {
    const LeaguesDoc = firestore.collection('leagues').doc('all');
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

  console.log('Generating tables and mapping results...');
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
      const LeagueItemsDoc = firestore.collection('items').doc('all');
      await LeagueItemsDoc.set(Data);
    };

    const UpdateCurrencyDatabase = async (Data = {}) => {
      const LeagueItemsDoc = firestore.collection('items').doc('currency');
      await LeagueItemsDoc.set(Data);
    };

    const UpdateLeagueDates = async (Data = {}) => {
      const LeagueItemsDoc = firestore.collection('items').doc('updated');
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

if (process.env.NODE_ENV === 'development') {
  process.nextTick(async () => main());
}

exports.handler = async () => {
  await main();

  const response = {
    statusCode: 200,
    body: JSON.stringify('Job done.'),
  };

  return response;
};
