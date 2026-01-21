/* eslint-disable no-console */

// Repositories
import { leagueRepository as defaultLeagueRepository } from '@infrastructure/repositories/league.repository';

// Services
import { profitCalculationService as defaultProfitCalculationService } from '@application/services/profit-calculation.service';
import { leagueDataService as defaultLeagueDataService } from '@application/services/league-data.service';
import { dataStorageService as defaultDataStorageService } from '@application/services/data-storage.service';
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

    const extractionGenerator = this.extractService.extract();

    // Process each league incrementally as it's extracted
    // eslint-disable-next-line no-restricted-syntax
    for await (const { league, data, timestamp } of extractionGenerator) {
      const { flipTable, currency } = this.transformService.transformLeague(
        league.name,
        data,
      );

      await this.loadService.loadLeague(league, flipTable, currency, timestamp);
      console.log(`Successfully processed league: ${league.name}`);
    }

    console.log('ETL pipeline completed successfully');
  }
}

const defaultExtractService = new ExtractService(
  defaultLeagueRepository,
  defaultLeagueDataService,
);

const defaultTransformService = new TransformService(
  defaultProfitCalculationService,
);

const defaultLoadService = new LoadService(
  defaultDataStorageService,
);

export const app = new App(
  defaultExtractService,
  defaultTransformService,
  defaultLoadService,
);
