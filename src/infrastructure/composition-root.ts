import { S3Client } from '@aws-sdk/client-s3';
import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { RewardParserService } from '@domain/services/reward-parser.service';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { PoeNinjaLeagueService } from '@infrastructure/adapters/http/poe-ninja-league.service';
import { PoeNinjaService } from '@infrastructure/adapters/http/poe-ninja.service';
import { PoeAtlasService } from '@infrastructure/adapters/http/poe-atlas.service';
import { PoeNinjaExchangeService } from '@infrastructure/adapters/http/poe-ninja-exchange.service';
import { PoeNinjaCurrencyExchangeService } from '@infrastructure/adapters/http/poe-ninja-currency-exchange.service';
import { LeagueRepository } from '@infrastructure/adapters/persistence/league.repository';
import { LeagueAdapter } from '@infrastructure/adapters/league.adapter';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { R2LoadAdapter } from '@infrastructure/adapters/etl/r2-load.adapter';
import { FanOutService } from '@infrastructure/adapters/etl/fan-out.service';
import { App } from '@infrastructure/app';

const logger = console;

// R2 (S3-compatible) configuration — required at construction time; fail loudly if missing
// so a misconfigured deploy never silently runs without a persistence sink.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`composition-root: missing required env var ${name}`);
  }
  return value;
}

const r2AccountId = requireEnv('R2_ACCOUNT_ID');
const r2AccessKeyId = requireEnv('R2_ACCESS_KEY_ID');
const r2SecretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
const r2Bucket = requireEnv('R2_BUCKET');
const r2Endpoint = process.env.R2_ENDPOINT ?? `https://${r2AccountId}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

// Infrastructure
const httpClient = new HttpClient();
const poeNinjaLeagueService = new PoeNinjaLeagueService(httpClient, logger);
const poeNinjaService = new PoeNinjaService(httpClient, logger);
const divCardDefinitionSource = new PoeAtlasService(httpClient, logger);
const divCardPriceSource = new PoeNinjaExchangeService(httpClient, logger);
const currencyPriceSource = new PoeNinjaCurrencyExchangeService(httpClient, logger);
const leagueRepository = new LeagueRepository(poeNinjaLeagueService);
const leagueAdapter = new LeagueAdapter(
  poeNinjaService,
  divCardDefinitionSource,
  divCardPriceSource,
  currencyPriceSource,
  logger,
);

// Domain services
const rewardParser = new RewardParserService(logger);
const rewardMatcher = new RewardMatcherService(logger);
const calculator = new ArbitrageCalculationService();
const trustValidator = new TrustValidationService();
const evaluator = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator, logger);

// ETL adapters
const extractAdapter = new ExtractAdapter(leagueRepository, rewardParser, leagueAdapter, logger);
const transformAdapter = new TransformAdapter(evaluator, logger);
const fanOutService = new FanOutService(logger);
const loadAdapter = new R2LoadAdapter(s3Client, r2Bucket, logger, fanOutService);

// App
export const app = new App(extractAdapter, transformAdapter, loadAdapter, logger);
export const compositionLogger = logger;
