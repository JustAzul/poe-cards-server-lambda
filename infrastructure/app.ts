/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

// Repositories
import { leagueRepository as _leagueRepository } from '@infrastructure/adapters/persistence/league.repository';
import { cardRepository as _cardRepository } from '@infrastructure/adapters/persistence/card.repository';

// Services
import { arbitrageEvaluator as _arbitrageEvaluator } from '@application/use-case/arbitrage-evaluator.use-case';
import { leagueAdapter as _leagueAdapter } from '@infrastructure/adapters/league.adapter';
import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';

export class App {
  constructor(
    private readonly extractAdapter: ExtractAdapter,
    private readonly transformAdapter: TransformAdapter,
    private readonly loadAdapter: LoadAdapter,
  ) {}

  async execute(): Promise<void> {
    console.log('Starting ETL pipeline with incremental processing...');

    // eslint-disable-next-line no-restricted-syntax
    for await (const { league, data } of this.extractAdapter.extract()) {
      const { profitTable, currency: currencyData } = this.transformAdapter.transform(
        league.name,
        data.items,
        data.currency,
        data.cards,
      );

      await this.loadAdapter.load(league, profitTable, currencyData, data.timestamp);
      console.log(`Successfully processed league: ${league.name}`);
    }

    console.log('ETL pipeline completed successfully');
  }
}

const _extractAdapter = new ExtractAdapter(
  _leagueRepository,
  _cardRepository,
  _leagueAdapter,
);

const _transformAdapter = new TransformAdapter(
  _arbitrageEvaluator,
);

const _loadAdapter = new LoadAdapter();

export const app = new App(
  _extractAdapter,
  _transformAdapter,
  _loadAdapter,
);
