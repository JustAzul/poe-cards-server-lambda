import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { RewardParserService } from '@domain/services/reward-parser.service';
import { PoeApiService } from '@infrastructure/adapters/http/poe-api.service';
import { PoeNinjaService } from '@infrastructure/adapters/http/poe-ninja.service';
import { LeagueRepository } from '@infrastructure/adapters/persistence/league.repository';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { App } from '@infrastructure/app';

// Infrastructure
const poeApiService = new PoeApiService();
const poeNinjaService = new PoeNinjaService();
const leagueRepository = new LeagueRepository(poeApiService);
const leagueAdapter = new LeagueAdapter(poeNinjaService);

// Domain services
const rewardParser = new RewardParserService();
const rewardMatcher = new RewardMatcherService();
const calculator = new ArbitrageCalculationService();
const trustValidator = new TrustValidationService();
const evaluatorService = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator);

// ETL adapters
const extractAdapter = new ExtractAdapter(leagueRepository, rewardParser, leagueAdapter);
const transformAdapter = new TransformAdapter(evaluatorService);
const loadAdapter = new LoadAdapter();

// App
export const app = new App(extractAdapter, transformAdapter, loadAdapter);
