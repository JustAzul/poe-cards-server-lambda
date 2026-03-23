import { IExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { ITransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { ILoadAdapter } from '@infrastructure/adapters/etl/load.adapter';
import { Logger } from '@shared/logger';

export class App {
  constructor(
    private readonly extractAdapter: IExtractAdapter,
    private readonly transformAdapter: ITransformAdapter,
    private readonly loadAdapter: ILoadAdapter,
    private readonly logger: Logger = console,
  ) {}

  async execute(): Promise<{ processed: number; failed: number }> {
    this.logger.log('Starting ETL pipeline with incremental processing...');
    let processedCount = 0;
    let errorCount = 0;

    for await (const { league, data, error } of this.extractAdapter.extract()) {
      if (error) {
        errorCount += 1;
        this.logger.error(`Extraction failed for league ${league.name}:`, error.message);
      } else {
        try {
          const { profitTable, currency: currencyData } = this.transformAdapter.transform(
            league.name,
            data.items,
            data.currency,
            data.cards,
          );

          this.loadAdapter.load(league, profitTable, currencyData, data.timestamp);
          processedCount += 1;
          this.logger.log(`Successfully processed league: ${league.name}`);
        } catch (err) {
          errorCount += 1;
          this.logger.error(`Failed to process league ${league.name}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    this.logger.log(`ETL pipeline completed: ${processedCount} succeeded, ${errorCount} failed`);
    return { processed: processedCount, failed: errorCount };
  }
}
