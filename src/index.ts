/* eslint-disable no-console */

import FindLeaguesUseCase from 'application/use-cases/find-leagues.use-case';
import FetchFlipDataUseCase from 'application/use-cases/fetch-flip-data.use-case';
import GenerateFlipTableUseCase from 'application/use-cases/generate-flip-table.use-case';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';
import FETCH_LIST from 'config/fetch-list';
import CARDS from 'config/cards';
import CURRENCY_CARDS from 'config/currency-cards';
import { ItemClass } from 'domain/entities/item-class.enum';

import HttpClient from 'infra/http/client';
import HttpLeagueRepository from 'infra/http/league/league.repository';
import HttpLeagueMapper from 'infra/http/league/league.mapper';
import PoeNinjaService from 'infra/http/poe-ninja';
import HttpItemOverviewRepository from 'infra/http/poe-ninja/item-overview.repository';
import HttpCurrencyOverviewRepository from 'infra/http/poe-ninja/currency-overview.repository';
import ConsoleFlipTableRepository from 'infra/console-flip-table.repository';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  const httpClient = new HttpClient();
  const poeNinjaService = new PoeNinjaService(httpClient);

  // Build dependencies in correct order
  const buildLeagueEntity = new BuildEntityUseCase('LeagueEntity');
  const leagueMapper = new HttpLeagueMapper(buildLeagueEntity);
  const leagueRepository = new HttpLeagueRepository(httpClient, leagueMapper);
  const itemOverviewRepository = new HttpItemOverviewRepository(poeNinjaService);
  const currencyOverviewRepository = new HttpCurrencyOverviewRepository(
    poeNinjaService,
  );
  const flipTableRepository = new ConsoleFlipTableRepository();

  // Use Cases with correct constructor patterns
  const findLeagues = new FindLeaguesUseCase({
    interfaces: {
      leagueRepository,
    },
  });

  const fetchFlipData = new FetchFlipDataUseCase({
    interfaces: { 
      itemRepository: itemOverviewRepository, 
      currencyRepository: currencyOverviewRepository 
    },
    config: { itemTypes: FETCH_LIST },
  });

  console.log('--- Trying to find leagues ---');
  const leagueEntities = await findLeagues.execute();
  const leagues = leagueEntities.map((l) => l.name);
  console.log(`--- Found leagues: ${leagues.join(', ')} ---`);

  const leagueData = await fetchFlipData.execute(leagues);
  
  console.log('--- League data keys:', Object.keys(leagueData));
  console.log('--- League data:', leagueData);

  for (const league of leagues) {
    console.log(`--- Processing league: ${league} ---`);
    
    if (!leagueData[league]) {
      console.log(`--- No data available for league: ${league}, skipping ---`);
      continue;
    }
    
    const { items, currencies } = leagueData[league];

    const cardRows = CARDS.map((card) => {
      const cardItem = items.find(
        (i) => i.name === card.cardName && i.itemClass === ItemClass.DivinationCard,
      );
      const rewardItem = items.find(
        (i) => i.name === card.rewardName && i.itemClass === card.itemClass,
      );

      return {
        cardPriceChaos: cardItem?.chaosValue ?? 0,
        name: card.cardName,
        rewardChaos: rewardItem?.chaosValue ?? 0,
        setSize: cardItem?.stackSize ?? 0,
      };
    });

    const currencyCardRows = CURRENCY_CARDS.map((card) => {
      const cardItem = items.find(
        (i) => i.name === card.cardName && i.itemClass === ItemClass.DivinationCard,
      );
      const currencyItem = currencies.find((c) => c.name === card.rewardName);

      return {
        cardPriceChaos: cardItem?.chaosValue ?? 0,
        currencyChaos: (currencyItem?.chaosValue ?? 0) * card.amount,
        name: card.cardName,
        setSize: card.amount,
      };
    });

    const flipTable = GenerateFlipTableUseCase.execute({
      cards: cardRows,
      currencyCards: currencyCardRows,
    });

    if (flipTable.length === 0) {
      console.log(`--- No profitable cards found for league: ${league} ---`);
      console.log(`--- This league has no divination card arbitrage opportunities ---`);
      continue;
    }

    console.log(`\n--- FLIP TABLE FOR: ${league.toUpperCase()} ---`);
    console.log(`--- Found ${flipTable.length} profitable opportunities ---`);
    console.table(flipTable);

    await flipTableRepository.save(flipTable, league);
  }
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

if (process.env.NODE_ENV !== 'production') {
  main();
}

export { handler, main };
