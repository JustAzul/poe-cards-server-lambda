import { ItemOverview } from '@domain/value-objects/item-overview';
import { IMarketDataApiWithRaw } from '@infrastructure/ports/market-data-with-raw.port';
import {
  ItemOverviewApiResponse,
  PoeNinjaItemLine,
} from '@infrastructure/types/poe-ninja.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

export class PoeNinjaService implements IMarketDataApiWithRaw {
  constructor(
    private readonly client: HttpClient,
    private readonly logger: Logger,
  ) {}

  async fetchItemOverview(league: string, type: string): Promise<ItemOverview[]> {
    const rawLines = await this.fetchRawItemLines(league, type);

    return rawLines.map((line) => new ItemOverview({
      name: line.name,
      itemClass: line.itemClass,
      chaosValue: line.chaosValue,
      corrupted: line.corrupted,
      links: line.links,
      gemLevel: line.gemLevel,
      count: line.count,
      stackSize: line.stackSize,
    }));
  }

  async fetchRawItemLines(league: string, type: string): Promise<PoeNinjaItemLine[]> {
    const url = 'https://poe.ninja/poe1/api/economy/stash/current/item/overview';
    const response = await this.client.get<ItemOverviewApiResponse>(url, {
      league,
      type,
      language: 'en',
    });

    if (!Array.isArray(response.lines)) {
      this.logger.warn(`[PoeNinjaService] Unexpected response shape for ${type}: missing 'lines' array`);
      return [];
    }

    const validLines = response.lines.filter(
      (line) => typeof line.name === 'string'
        && typeof line.chaosValue === 'number'
        && !Number.isNaN(line.chaosValue)
        && typeof line.itemClass === 'number'
        && !Number.isNaN(line.itemClass),
    );

    const droppedCount = response.lines.length - validLines.length;
    if (droppedCount > 0) {
      this.logger.warn(
        `[PoeNinjaService] Dropped ${droppedCount} invalid ${type} entries for ${league}`,
      );
    }

    return validLines;
  }
}
