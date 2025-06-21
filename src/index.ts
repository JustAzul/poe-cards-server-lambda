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
import FirestoreFlipTableRepository from 'infra/firestore-flip-table.repository';

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
  const flipTableRepository = new FirestoreFlipTableRepository();

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

    try {
      await flipTableRepository.save(flipTable, league);
      console.log(`✅ Successfully saved flip table for league: ${league}`);
    } catch (error: any) {
      // Handle Firestore API not enabled error
      if (error.code === 7 && error.message?.includes('Cloud Firestore API has not been used')) {
        console.error(`\n❌ FIRESTORE API ERROR: Cloud Firestore API is not enabled`);
        console.error(`\n🔧 HOW TO FIX:`);
        console.error(`1. Visit: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.FIREBASE_PROJECT_ID}`);
        console.error(`2. Click "Enable" to activate the Firestore API`);
        console.error(`3. Wait 2-3 minutes for the API to propagate`);
        console.error(`4. Re-run the application\n`);
        process.exit(1);
      }
      
      // Handle Firestore database not found error
      if (error.code === 5 && error.message?.includes('NOT_FOUND')) {
        console.error(`\n❌ FIRESTORE DATABASE ERROR: Firestore database not found`);
        console.error(`\n🔧 HOW TO FIX:`);
        console.error(`1. Visit: https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/firestore`);
        console.error(`2. Click "Create database" if you haven't created one yet`);
        console.error(`3. Choose "Start in production mode" or "Start in test mode"`);
        console.error(`4. Select your preferred database location`);
        console.error(`5. Wait for the database to be created (usually 1-2 minutes)`);
        console.error(`6. Re-run the application\n`);
        process.exit(1);
      }
      
      // Handle authentication/permission errors
      if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
        console.error(`\n❌ FIRESTORE AUTHENTICATION ERROR: Invalid credentials`);
        console.error(`\n🔧 HOW TO FIX:`);
        console.error(`1. Verify your .env file contains valid FIREBASE_* credentials`);
        console.error(`2. Ensure the service account has Firestore access permissions`);
        console.error(`3. Check that the private key is properly formatted (single line with \\n)`);
        console.error(`4. Verify the project ID matches your Google Cloud project\n`);
        process.exit(1);
      }
      
      // Handle general Firestore errors
      if (error.message?.includes('firestore') || error.message?.includes('Firestore')) {
        console.error(`\n❌ FIRESTORE ERROR: ${error.message}`);
        console.error(`\n🔧 TROUBLESHOOTING STEPS:`);
        console.error(`1. Check your internet connection`);
        console.error(`2. Verify Firestore is properly configured in Google Cloud Console`);
        console.error(`3. Ensure your service account has the correct permissions`);
        console.error(`4. Check the error details above for specific guidance\n`);
        process.exit(1);
      }
      
      // Re-throw unexpected errors
      throw error;
    }
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
