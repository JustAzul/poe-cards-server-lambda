import { ExtractAdapter } from '@infrastructure/adapters/etl/extract.adapter';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { LoadAdapter } from '@infrastructure/adapters/etl/load.adapter';

export class App {
  constructor(
    private readonly extractAdapter: ExtractAdapter,
    private readonly transformAdapter: TransformAdapter,
    private readonly loadAdapter: LoadAdapter,
  ) {}

  async execute(): Promise<{ processed: number; failed: number }> {
    console.log('Starting ETL pipeline with incremental processing...');
    let processedCount = 0;
    let errorCount = 0;

    for await (const { league, data } of this.extractAdapter.extract()) {
      try {
        const { profitTable, currency: currencyData } = this.transformAdapter.transform(
          league.name,
          data.items,
          data.currency,
          data.cards,
        );

        await this.loadAdapter.load(league, profitTable, currencyData, data.timestamp);
        processedCount += 1;
        console.log(`Successfully processed league: ${league.name}`);
      } catch (error) {
        errorCount += 1;
        console.error(`Failed to process league ${league.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`ETL pipeline completed: ${processedCount} succeeded, ${errorCount} failed`);
    return { processed: processedCount, failed: errorCount };
  }
}
