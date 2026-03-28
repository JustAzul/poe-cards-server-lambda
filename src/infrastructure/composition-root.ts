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
import { App } from '@infrastructure/app';

// Infrastructure
const httpClient = new HttpClient();
const poeApiService = new PoeApiService(httpClient);
const poeNinjaService = new PoeNinjaService(httpClient, console);
const leagueRepository = new LeagueRepository(poeApiService);
const leagueAdapter = new LeagueAdapter(poeNinjaService, console);

// Domain services
const rewardParser = new RewardParserService(console);
const rewardMatcher = new RewardMatcherService(console);
const calculator = new ArbitrageCalculationService();
const trustValidator = new TrustValidationService();
const evaluator = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator, console);

// ETL adapters
const extractAdapter = new ExtractAdapter(leagueRepository, rewardParser, leagueAdapter, console);
const transformAdapter = new TransformAdapter(evaluator, console);
const loadAdapter = new LoadAdapter(console);

// App
export const app = new App(extractAdapter, transformAdapter, loadAdapter, console);
