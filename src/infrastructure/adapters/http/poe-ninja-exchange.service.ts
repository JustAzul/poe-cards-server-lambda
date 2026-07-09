import { DivCardPrice, IDivCardPriceSource } from '@infrastructure/ports/div-card-price-source.port';
import {
  PoeNinjaExchangeResponse,
  PoeNinjaExchangeItem,
  PoeNinjaExchangeLine,
} from '@infrastructure/types/poe-ninja-exchange.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const EXCHANGE_URL = 'https://poe.ninja/poe1/api/economy/exchange/current/overview';
const DIVINATION_CARD_TYPE = 'DivinationCard';
const CHAOS_PRIMARY = 'chaos';

/**
 * Div-card price source backed by the poe.ninja exchange endpoint.
 * DivinationCard prices moved here from the stash overview; the normalized
 * `{core, items, lines}` shape carries prices only (no reward text/art/stack).
 */
export class PoeNinjaExchangeService implements IDivCardPriceSource {
  constructor(
    private readonly client: HttpClient,
    private readonly logger: Logger,
  ) {}

  async fetchPrices(league: string): Promise<DivCardPrice[]> {
    const response = await this.client.get<PoeNinjaExchangeResponse>(EXCHANGE_URL, {
      league,
      type: DIVINATION_CARD_TYPE,
    });

    if (!this.isWellFormed(response)) {
      this.logger.warn(`[PoeNinjaExchangeService] Unexpected exchange shape for ${league} — degrading to no prices`);
      return [];
    }

    if (response.core.primary !== CHAOS_PRIMARY) {
      this.logger.warn(
        `[PoeNinjaExchangeService] Exchange primary currency is '${response.core.primary}', expected '${CHAOS_PRIMARY}'`,
      );
    }

    const itemsById = PoeNinjaExchangeService.indexItemsById(response.items);
    const prices: DivCardPrice[] = [];
    let droppedCount = 0;

    for (const line of response.lines) {
      const price = PoeNinjaExchangeService.toPrice(line, itemsById);

      if (price) {
        prices.push(price);
      } else {
        droppedCount += 1;
      }
    }

    if (droppedCount > 0) {
      this.logger.warn(`[PoeNinjaExchangeService] Dropped ${droppedCount} unjoinable/invalid exchange lines for ${league}`);
    }

    return prices;
  }

  /**
   * Join one price line to its item by id and normalize to a DivCardPrice.
   * Returns null when the line can't be joined or its price is not finite.
   * Non-finite/absent volume degrades to 0 (treated as no liquidity).
   */
  private static toPrice(
    line: PoeNinjaExchangeLine,
    itemsById: Map<string, PoeNinjaExchangeItem>,
  ): DivCardPrice | null {
    const item = typeof line.id === 'string' ? itemsById.get(line.id) : undefined;

    if (!item || !Number.isFinite(line.primaryValue)) return null;

    const volume = typeof line.volumePrimaryValue === 'number' && Number.isFinite(line.volumePrimaryValue)
      ? line.volumePrimaryValue
      : 0;

    return {
      slug: line.id,
      name: item.name,
      chaosValue: line.primaryValue,
      volumePrimaryValue: volume,
    };
  }

  private isWellFormed(response: PoeNinjaExchangeResponse): boolean {
    return Boolean(response)
      && Array.isArray(response.lines)
      && Array.isArray(response.items)
      && Boolean(response.core)
      && typeof response.core.primary === 'string';
  }

  private static indexItemsById(items: PoeNinjaExchangeItem[]): Map<string, PoeNinjaExchangeItem> {
    const itemsById = new Map<string, PoeNinjaExchangeItem>();

    for (const item of items) {
      if (typeof item.id === 'string' && typeof item.name === 'string') {
        itemsById.set(item.id, item);
      }
    }

    return itemsById;
  }
}
