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
    const extractionResult = await this.extractService.extract();
    const transformationResult = await this.transformService.transform(extractionResult.rawData);

    await this.loadService.load(
      extractionResult.leagues,
      transformationResult.tableResults,
      transformationResult.currencyResults,
      extractionResult.timestamps,
    );
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
