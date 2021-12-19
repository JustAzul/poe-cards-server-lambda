/* eslint-disable max-len */
const { duration } = require('moment');
const { sleep } = require('azul-tools');

const { CurrencyOverview, ItemOverview } = require('./Fetch');
const fetchList = require('../config/fetchList');

async function Delay(DelaySize = 2) {
  console.log(`Waiting ${DelaySize} seconds delay..`);
  await sleep(duration(DelaySize, 'seconds'));
}

function ChaosToExalted(ExaltedValue = 0, ChaosValue = 0) {
  return parseFloat(parseFloat(ChaosValue / ExaltedValue).toFixed(1));
}

async function FindRewardOverview(LeagueOverview, CardDetails = {}, isCurrency = false) {
  if (isCurrency) return LeagueOverview.filter(({ currencyTypeName }) => currencyTypeName === CardDetails.Reward);

  const Result = LeagueOverview
    .filter(({ name, itemClass }) => name === CardDetails.Reward && itemClass === CardDetails.iClass)
    .filter(({ corrupted = false }) => corrupted === CardDetails.Corrupted)
    .filter(({ links = 0 }) => links === CardDetails.Links)
    .filter(({ gemLevel = 0 }) => gemLevel === CardDetails.gemLevel);

  return Result;
}

async function findCardOverview(LeagueOverview = {}, CardDetails = {}, isCurrency = false) {
  // const LeagueOverview = Data[leagueName];

  const Results = {
    CardOverview: LeagueOverview.find(({ name, itemClass }) => name === CardDetails.Name && itemClass === 6),
    RewardOverview: await FindRewardOverview(LeagueOverview, CardDetails, isCurrency),
  };

  if (Results.RewardOverview.length === 1) {
    Results.RewardOverview = Results.RewardOverview.shift();
    return Results;
  }

  return false;
}

async function GetLeagueOverview(leagueName = '') {
  const RequestCurrency = async () => {
    console.log(`Requesting league '${leagueName}' Currency..`);

    const Result = await CurrencyOverview(leagueName);
    return Result;
  };

  const RequestItems = async () => {
    const Results = [];

    for (let i = 0; i < fetchList.length; i += 1) {
      const Type = fetchList[i];

      console.log(`Request league '${leagueName}' ${Type}'s..`);

      {
        // eslint-disable-next-line no-await-in-loop
        const Result = await ItemOverview(leagueName, Type);
        console.log(`Found ${Result.length} ${leagueName} ${Type}'s!`);

        Results.push(...Result);
      }

      // eslint-disable-next-line no-await-in-loop
      if (i !== (fetchList.length - 1)) await Delay();
    }

    return Results;
  };

  const CurrencyResult = await RequestCurrency();
  await Delay();
  const ItemsResult = await RequestItems();

  return [
    ...ItemsResult,
    ...CurrencyResult,
  ];
}

async function GetLeagueExaltedValue(LeagueOverview = {}) {
  // const LeagueOverview = Data[leagueName];
  const { chaosEquivalent } = LeagueOverview.find(({ currencyTypeName }) => currencyTypeName === 'Exalted Orb') || undefined;
  return chaosEquivalent || 0;
}

module.exports = {
  findCardOverview,
  GetLeagueExaltedValue,
  GetLeagueOverview,
  ChaosToExalted,
  Delay,
};
