import { DivCardPrice, IDivCardPriceSource } from '@infrastructure/ports/div-card-price-source.port';
import { PoeNinjaExchangeResponse } from '@infrastructure/types/poe-ninja-exchange.types';
import { ExchangeOverviewParser } from '@infrastructure/adapters/http/exchange-overview.parser';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const EXCHANGE_URL = 'https://poe.ninja/poe1/api/economy/exchange/current/overview';
const DIVINATION_CARD_TYPE = 'DivinationCard';

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

    return ExchangeOverviewParser.parse(
      response,
      (line, item, chaosValue, chaosVolume) => ({
        slug: line.id,
        name: item.name,
        chaosValue,
        volumePrimaryValue: chaosVolume,
      }),
      { warn: (message) => this.logger.warn(message), label: `PoeNinjaExchangeService ${league}` },
    );
  }
}
