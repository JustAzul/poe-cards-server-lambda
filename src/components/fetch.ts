import { LeagueResponse } from '../types/league-response.type';
import axios from 'axios';
import userAgent from '../constants/user-agent';
import utils from './fetch.utils';
// import { got } from 'got';
// const got = require('got');
// const moment = require('moment');
// const { sleep } = require('azul-tools');

export default {
  async leaguesData(): Promise<LeagueResponse[]> {
    const { data } = await axios.get<LeagueResponse[]>('https://api.pathofexile.com/leagues', {
      responseType: 'json',
      headers: {
        'user-agent': userAgent,
      },
    });

    return utils.filterLeagues(data);
  },
  utils,
};

// async function RequestItemOverview(League, Type) {
//   const o = {
//     url: 'https://poe.ninja/api/data/itemoverview',
//     searchParams: {
//       league: League,
//       type: Type,
//       language: 'en',
//     },
//     responseType: 'json',
//   };

//   try {
//     const { body } = await got(o);
//     const { lines } = body;
//     return lines;
//   } catch (err) {
//     console.error(err);
//     await sleep(moment.duration(2, 'second'));
//     return RequestItemOverview(League, Type);
//   }
// }

// async function RequestCurrencyOverview(League) {
//   const o = {
//     url: 'https://poe.ninja/api/data/currencyoverview',
//     searchParams: {
//       league: League,
//       type: 'Currency',
//     },
//     responseType: 'json',
//   };

//   try {
//     const { body } = await got(o);

//     const { lines: CurrencyOverview/* , currencyDetails: CurrencyDetails */ } = body;

//     /* const Response = {
//       Overview: CurrencyOverview,
//       Details: CurrencyDetails,
//     }; */

//     return CurrencyOverview;
//   } catch (err) {
//     console.error(err);
//     await sleep(moment.duration(2, 'seconds'));
//     return RequestCurrencyOverview(League);
//   }
// }

// module.exports = {
//   LeaguesOverview: RequestLeaguesOverview,
//   ItemOverview: RequestItemOverview,
//   CurrencyOverview: RequestCurrencyOverview,
// };
