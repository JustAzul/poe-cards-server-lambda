const { Delay } = require('./components/utils');
const { leagueRepository } = require('./infrastructure/repositories/league.repository');
const { leagueDataService } = require('./application/services/league-data.service');
const { profitCalculationService } = require('./application/services/profit-calculation.service');
const { dataStorageService } = require('./application/services/data-storage.service');

async function main() {
  console.log('Fetching Leagues..');
  const Leagues = await leagueRepository.getAllLeagues();
  console.log(`Found ${Object.keys(Leagues).length} leagues!`);

  const UpdateLeagueList = async () => {
    console.log('Storing leagues in memory...');
    await dataStorageService.dataStorageRepository.setLeagues(Leagues);
  };

  await UpdateLeagueList();

  const UpdatedAt = {};

  const GetLeagueData = async () => {
    const LeaguesData = Object.values(Leagues);

    const Results = {};

    for (let i = 0; i < LeaguesData.length; i += 1) {
      const { leagueName } = LeaguesData[i];

      console.log(`Requesting league '${leagueName}' Overview..`);
      Results[leagueName] = await leagueDataService.fetchLeagueOverview(leagueName);
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
        profitCalculationService.generateFlipTable(LeagueDatas[leagueName])
          .then((Result) => {
            TableResults[leagueName] = Result;
          }),
      );
    }

    await Promise.all(Workload);
  }

  {
    console.log('Storing processed data...');
    await dataStorageService.storeAllData(
      Leagues,
      TableResults,
      CurrencyResults,
      UpdatedAt,
    );
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
