/* eslint-disable no-console */

// Repositories
import { leagueRepository as defaultLeagueRepository } from '@infrastructure/repositories/league.repository';
import { cardRepository as defaultCardRepository } from '@infrastructure/repositories/card.repository';

// Services
import { profitCalculationService as defaultProfitCalculationService } from '@application/services/profit-calculation.service';
import { leagueService as defaultLeagueService } from '@infrastructure/services/league.service';
import { storageService as defaultStorageService } from '@application/services/storage.service';
import { ExtractService } from '@infrastructure/services/extract.service';
import { TransformService } from '@infrastructure/services/transform.service';
import { LoadService } from '@infrastructure/services/load.service';

// Interfaces
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';

export class App {
  constructor(
    private readonly extractService: ExtractService,
    private readonly transformService: TransformService,
    private readonly loadService: LoadService,
    private readonly cardRepository: ICardRepository,
  ) {}

  async execute(): Promise<void> {
    console.log('Starting ETL pipeline with incremental processing...');

    const cards = this.cardRepository.getAllCards();

    // eslint-disable-next-line no-restricted-syntax
    for await (const {
      league,
      items,
      currency,
      timestamp,
    } of this.extractService.extract()) {
      const { flipTable, currency: currencyData } = this.transformService.transformLeague(
        league.name,
        items,
        currency,
        cards,
      );

      await this.loadService.loadLeague(league, flipTable, currencyData, timestamp);
      console.log(`Successfully processed league: ${league.name}`);
    }

    console.log('ETL pipeline completed successfully');
  }
}

const defaultExtractService = new ExtractService(
  defaultLeagueRepository,
  defaultLeagueService,
);

const defaultTransformService = new TransformService(
  defaultProfitCalculationService,
);

const defaultLoadService = new LoadService(
  defaultStorageService,
);

export const app = new App(
  defaultExtractService,
  defaultTransformService,
  defaultLoadService,
  defaultCardRepository,
);
