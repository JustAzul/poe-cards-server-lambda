import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ICurrencyPriceSource } from '@infrastructure/ports/currency-price-source.port';
import { PoeNinjaExchangeResponse } from '@infrastructure/types/poe-ninja-exchange.types';
import { ExchangeOverviewParser, finiteVolume } from '@infrastructure/adapters/http/exchange-overview.parser';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const EXCHANGE_URL = 'https://poe.ninja/poe1/api/economy/exchange/current/overview';
const CURRENCY_TYPE = 'Currency';

/**
 * Currency price source backed by the poe.ninja exchange endpoint.
 * The stash currency overview is being deprecated (decayed to a partial set);
 * the exchange endpoint carries the full set in the same normalized shape as
 * div-card prices. Chaos Orb arrives as a real line (chaosEquivalent 1).
 */
export class PoeNinjaCurrencyExchangeService implements ICurrencyPriceSource {
  constructor(
    private readonly client: HttpClient,
    private readonly logger: Logger,
  ) {}

  async fetchCurrencyPrices(league: string): Promise<CurrencyItem[]> {
    const response = await this.client.get<PoeNinjaExchangeResponse>(EXCHANGE_URL, {
      league,
      type: CURRENCY_TYPE,
    });

    return ExchangeOverviewParser.parse(
      response,
      (line, item, chaosValue) => new CurrencyItem({
        currencyTypeName: item.name,
        chaosEquivalent: chaosValue,
        volumePrimaryValue: finiteVolume(line.volumePrimaryValue),
      }),
      { warn: (message) => this.logger.warn(message), label: `PoeNinjaCurrencyExchangeService ${league}` },
    );
  }
}
