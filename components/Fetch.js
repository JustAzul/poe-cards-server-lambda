const got = require('got');
const moment = require('moment');
const { sleep } = require('azul-tools');

async function RequestLeaguesOverview() {
  const RemoveUnusedLeagues = (data) => data
    .filter(({ id }) => id.indexOf('SSF') === -1) // Removing SSF Leagues
    .filter(({ event }) => !event) // Removing event leagues
    .filter(({ realm }) => realm === 'pc') // Picking pc leagues
  // .filter(({ id }) => id !== 'Standard') // Removing STD League
    .filter(({ id }) => id !== 'Hardcore'); // Removing STD-Hardcore League

  const o = {
    url: 'https://api.pathofexile.com/leagues',
    searchParams: {
      type: 'main',
      compact: 0,
    },
    responseType: 'json',
  };

  const { body } = await got(o);

  const LeaguesData = RemoveUnusedLeagues(body);
  const Leagues = {};

  for (let i = 0; i < LeaguesData.length; i += 1) {
    const { id, url } = LeaguesData[i];

    const LeagueObject = {
      leagueName: id,
      ladder: url,
    };

    Leagues[LeagueObject.leagueName] = LeagueObject;
  }

  return Leagues;
}

async function RequestItemOverview(League, Type) {
  const o = {
    url: 'https://poe.ninja/api/data/itemoverview',
    searchParams: {
      league: League,
      type: Type,
      language: 'en',
    },
    responseType: 'json',
  };

  try {
    const { body } = await got(o);
    const { lines } = body;
    return lines;
  } catch (err) {
    console.error(err);
    await sleep(moment.duration(2, 'second'));
    return RequestItemOverview(League, Type);
  }
}

async function RequestCurrencyOverview(League) {
  const o = {
    url: 'https://poe.ninja/api/data/currencyoverview',
    searchParams: {
      league: League,
      type: 'Currency',
    },
    responseType: 'json',
  };

  try {
    const { body } = await got(o);

    const { lines: CurrencyOverview/* , currencyDetails: CurrencyDetails */ } = body;

    /* const Response = {
      Overview: CurrencyOverview,
      Details: CurrencyDetails,
    }; */

    return CurrencyOverview;
  } catch (err) {
    console.error(err);
    await sleep(moment.duration(2, 'seconds'));
    return RequestCurrencyOverview(League);
  }
}

module.exports = {
  LeaguesOverview: RequestLeaguesOverview,
  ItemOverview: RequestItemOverview,
  CurrencyOverview: RequestCurrencyOverview,
};
