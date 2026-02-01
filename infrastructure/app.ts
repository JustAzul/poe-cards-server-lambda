/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

// Repositories
import { leagueRepository as _leagueRepository } from '@infrastructure/repositories/league.repository';
import { cardRepository as _cardRepository } from '@infrastructure/repositories/card.repository';

// Services
import { arbitrageEvaluator as _arbitrageEvaluator } from '@application/services/arbitrage-evaluator.service';
import { leagueService as _leagueService } from '@infrastructure/services/league.service';
import { ExtractService } from '@infrastructure/services/extract.service';
import { TransformService } from '@infrastructure/services/transform.service';
import { LoadService } from '@infrastructure/services/load.service';

export class App {
  constructor(
    private readonly extractService: ExtractService,
    private readonly transformService: TransformService,
    private readonly loadService: LoadService,
  ) {}

  async execute(): Promise<void> {
    console.log('Starting ETL pipeline with incremental processing...');

    // eslint-disable-next-line no-restricted-syntax
    for await (const { league, data } of this.extractService.extract()) {
      const { profitTable, currency: currencyData } = this.transformService.transform(
        league.name,
        data.items,
        data.currency,
        data.cards,
      );

      await this.loadService.load(league, profitTable, currencyData, data.timestamp);
      console.log(`Successfully processed league: ${league.name}`);
    }

    console.log('ETL pipeline completed successfully');
  }
}

const _extractService = new ExtractService(
  _leagueRepository,
  _cardRepository,
  _leagueService,
);

const _transformService = new TransformService(
  _arbitrageEvaluator,
);

const _loadService = new LoadService();

export const app = new App(
  _extractService,
  _transformService,
  _loadService,
);
