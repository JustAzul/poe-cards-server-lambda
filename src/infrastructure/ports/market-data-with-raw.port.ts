import { IMarketDataApi } from '@domain/ports/http-service.port';
import { PoeNinjaItemLine } from '@infrastructure/types/poe-ninja.types';

/**
 * Extended market data port that also exposes raw item lines
 * Used by the league adapter for divination card extraction
 */
export interface IMarketDataApiWithRaw extends IMarketDataApi {
  fetchRawItemLines(league: string, type: string): Promise<PoeNinjaItemLine[]>;
}
