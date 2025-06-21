/* eslint-disable no-console */

import 'reflect-metadata';

// Application layer imports
import FetchDivinationCardRewardsUseCase, { 
  FetchDivinationCardRewardsUseCaseInterfaces 
} from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import ParseCardRewardUseCase from '@/application/use-cases/parse-card-reward.use-case';
import DynamicCardConfigurationService, { 
  DynamicCardConfigurationServiceDependencies 
} from '@/application/services/dynamic-card-configuration.service';
import FetchFlipDataUseCase from '@/application/use-cases/fetch-flip-data.use-case';
import GenerateFlipTableUseCase from '@/application/use-cases/generate-flip-table.use-case';

// Infrastructure layer imports
import DivinationCardRewardsRepository from '@/infra/http/poe-ninja/divination-card-rewards.repository';
import CurrencyOverviewRepository from '@/infra/http/poe-ninja/currency-overview.repository';
import ItemOverviewRepository from '@/infra/http/poe-ninja/item-overview.repository';
import LeagueRepository from '@/infra/http/league/league.repository';
import ConsoleFlipTableRepository from '@/infra/console-flip-table.repository';
import { SimpleAsyncQueue } from '@/infra/async-queue/simple-async-queue';

// HTTP Client
import AxiosHttpClient from '@/infra/http/client/axios-http-client';

// Configuration
import { CARDS } from '@/config/cards';
import { CURRENCY_CARDS } from '@/config/currency-cards';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting POE Cards ETL Pipeline...');

    // Initialize HTTP client
    const httpClient = new AxiosHttpClient();

    // Initialize repositories
    const divinationCardRewardsRepository = new DivinationCardRewardsRepository({ httpClient });
    const currencyOverviewRepository = new CurrencyOverviewRepository({ httpClient });
    const itemOverviewRepository = new ItemOverviewRepository({ httpClient });
    const leagueRepository = new LeagueRepository({ httpClient });
    const flipTableRepository = new ConsoleFlipTableRepository();

    // Initialize async queue
    const asyncQueue = new SimpleAsyncQueue();

    // Initialize use cases
    const parseCardRewardUseCase = new ParseCardRewardUseCase();
    
    const fetchDivinationCardRewardsInterfaces: FetchDivinationCardRewardsUseCaseInterfaces = {
      repository: divinationCardRewardsRepository,
    };
    const fetchDivinationCardRewardsUseCase = new FetchDivinationCardRewardsUseCase({ 
      interfaces: fetchDivinationCardRewardsInterfaces 
    });

    // Initialize services
    const dynamicCardConfigServiceDependencies: DynamicCardConfigurationServiceDependencies = {
      fetchDivinationCardRewardsUseCase,
      parseCardRewardUseCase,
    };
    const dynamicCardConfigurationService = new DynamicCardConfigurationService(
      dynamicCardConfigServiceDependencies
    );

    // Get current leagues
    console.log('📡 Fetching current leagues...');
    const leagues = await leagueRepository.findAll();
    const currentLeague = leagues.find(league => league.id === 'Standard') || leagues[0];
    
    if (!currentLeague) {
      throw new Error('No leagues found');
    }

    console.log(`🎯 Processing league: ${currentLeague.id}`);

    // Build dynamic card configuration
    console.log('🔄 Building dynamic card configuration...');
    const dynamicConfig = await dynamicCardConfigurationService.buildConfiguration(currentLeague.id);
    
    console.log(`✅ Dynamic config built: ${dynamicConfig.cards.length} cards, ${dynamicConfig.currencyCards.length} currency cards`);

    // Use dynamic configuration or fallback to static
    const cardsToProcess = dynamicConfig.cards.length > 0 ? dynamicConfig.cards : CARDS;
    const currencyCardsToProcess = dynamicConfig.currencyCards.length > 0 ? dynamicConfig.currencyCards : CURRENCY_CARDS;

    console.log(`📊 Processing ${cardsToProcess.length} cards and ${currencyCardsToProcess.length} currency cards`);

    // Initialize other use cases with repositories
    const fetchFlipDataUseCase = new FetchFlipDataUseCase({
      currencyOverviewRepository,
      itemOverviewRepository,
    });

    const generateFlipTableUseCase = new GenerateFlipTableUseCase({
      flipTableRepository,
      asyncQueue,
    });

    // Fetch flip data
    console.log('💰 Fetching flip data...');
    const flipData = await fetchFlipDataUseCase.execute({
      league: currentLeague.id,
      cards: cardsToProcess,
      currencyCards: currencyCardsToProcess,
    });

    // Generate and display flip table
    console.log('📋 Generating flip table...');
    await generateFlipTableUseCase.execute(flipData);

    console.log('✨ ETL Pipeline completed successfully!');

  } catch (error) {
    console.error('❌ ETL Pipeline failed:', error);
        process.exit(1);
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
