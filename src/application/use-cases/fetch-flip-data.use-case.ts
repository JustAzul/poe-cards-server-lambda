import { ItemOverviewType } from 'config/fetch-list';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';
import {
  ICurrencyOverviewRepository,
  IItemOverviewRepository,
} from 'application/ports/http-repository.interface';

export interface FetchFlipDataUseCaseInterfaces {
  readonly itemRepository: IItemOverviewRepository;
  readonly currencyRepository: ICurrencyOverviewRepository;
}

export interface FetchFlipDataUseCaseConfig {
  readonly itemTypes: ItemOverviewType[];
  readonly currencyType?: string;
}

export interface FetchFlipDataUseCaseConstructor {
  readonly interfaces: FetchFlipDataUseCaseInterfaces;
  readonly config: FetchFlipDataUseCaseConfig;
}

export interface LeagueFlipData {
  readonly items: ItemOverviewEntity[];
  readonly currencies: CurrencyOverviewEntity[];
}

const DEFAULT_CURRENCY_TYPE = 'Currency' as const;

export default class FetchFlipDataUseCase {
  private readonly interfaces: FetchFlipDataUseCaseInterfaces;

  private readonly config: FetchFlipDataUseCaseConfig;

  constructor({ interfaces, config }: FetchFlipDataUseCaseConstructor) {
    this.interfaces = interfaces;
    this.config = config;
  }

  async execute(leagues: string[]): Promise<Record<string, LeagueFlipData>> {
    const promises = leagues.map((league) => this.fetchDataForLeague(league));
    const outcomes = await Promise.allSettled(promises);

    const result: Record<string, LeagueFlipData> = {};

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled' && outcome.value) {
        const { league, data } = outcome.value;
        result[league] = data;
      } else if (outcome.status === 'rejected') {
        // TODO: Replace with a proper logger
        console.error(`Failed to fetch data for a league:`, outcome.reason);
      }
    });

    return result;
  }

  private async fetchDataForLeague(
    league: string,
  ): Promise<{ league: string; data: LeagueFlipData } | null> {
    const { currencyRepository } = this.interfaces;
    const { currencyType = DEFAULT_CURRENCY_TYPE } = this.config;

    const [items, currencies] = await Promise.all([
      this.fetchItemsByLeague(league),
      currencyRepository.fetchAll({ league, type: currencyType }),
    ]);

    if (!items.length || !currencies.length) {
      return null;
    }

    return { league, data: { items, currencies } };
  }

  private async fetchItemsByLeague(
    league: string,
  ): Promise<ItemOverviewEntity[]> {
    const { itemRepository } = this.interfaces;
    const { itemTypes } = this.config;

    const promises = itemTypes.map((type) =>
      itemRepository.fetchAll({ league, type }),
    );

    const results = await Promise.all(promises);
    return results.flat();
  }
}
