import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { RewardParserService } from '@domain/services/reward-parser.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { PoeApiService } from '@infrastructure/adapters/http/poe-api.service';
import { PoeNinjaService } from '@infrastructure/adapters/http/poe-ninja.service';
import { LeagueRepository } from '@infrastructure/adapters/persistence/league.repository';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { SqliteLeagueStore } from '@infrastructure/persistence/sqlite/sqlite-league-store';
import { App } from '@infrastructure/app';

const logger = console;

// Infrastructure
const httpClient = new HttpClient();
const poeApiService = new PoeApiService(httpClient);
const poeNinjaService = new PoeNinjaService(httpClient, logger);
const leagueRepository = new LeagueRepository(poeApiService);
const leagueAdapter = new LeagueAdapter(poeNinjaService, logger);
const sqliteLeagueStore = new SqliteLeagueStore();

// Domain services
const rewardParser = new RewardParserService(logger);
const rewardMatcher = new RewardMatcherService(logger);
const calculator = new ArbitrageCalculationService();
const trustValidator = new TrustValidationService();
const evaluator = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator, logger);

// ETL adapters
const extractAdapter = new ExtractAdapter(leagueRepository, rewardParser, leagueAdapter, logger);
const transformAdapter = new TransformAdapter(evaluator, logger);
const loadAdapter = new LoadAdapter(sqliteLeagueStore, logger);

// App
export const app = new App(extractAdapter, transformAdapter, loadAdapter, logger);
export const store = sqliteLeagueStore;
export const compositionLogger = logger;
