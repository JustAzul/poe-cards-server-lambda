import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { RewardParserService } from '@domain/services/reward-parser.service';
import { ArbitrageEvaluator } from '@application/use-case/arbitrage-evaluator.use-case';
import { HttpService } from '@infrastructure/adapters/http/http.service';
import { LeagueRepository } from '@infrastructure/adapters/persistence/league.repository';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { App } from '@infrastructure/app';

// Infrastructure
const httpService = new HttpService();
const leagueRepository = new LeagueRepository(httpService);
const leagueAdapter = new LeagueAdapter(httpService);

// Domain services
const rewardParser = new RewardParserService(
  (cardName, reason, rawText) => {
    console.warn(
      `[RewardParser] Skipped "${cardName}": ${reason}`
      + (rawText ? ` | raw: ${rawText.substring(0, 80)}` : ''),
    );
  },
  (parsed, total, skipped) => {
    console.log(
      `[RewardParser] Parsed ${parsed}/${total}`
      + ` divination cards (${skipped} skipped)`,
    );
  },
);
const rewardMatcher = new RewardMatcherService(
  (cardName, rewardName, matchCount) => {
    console.warn(
      `[RewardMatcher] Ambiguous match: card "${cardName}"`
      + ` reward "${rewardName}" matched ${matchCount} items, skipping`,
    );
  },
);
const calculator = new ArbitrageCalculationService();
const trustValidator = new TrustValidationService();
const evaluatorService = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator);

// Application
const arbitrageEvaluator = new ArbitrageEvaluator(evaluatorService);

// ETL adapters
const extractAdapter = new ExtractAdapter(leagueRepository, rewardParser, leagueAdapter);
const transformAdapter = new TransformAdapter(arbitrageEvaluator);
const loadAdapter = new LoadAdapter();

// App
export const app = new App(extractAdapter, transformAdapter, loadAdapter);
