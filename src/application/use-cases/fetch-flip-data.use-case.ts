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
    const { currencyRepository } = this.interfaces;
    const { currencyType = DEFAULT_CURRENCY_TYPE } = this.config;

    const result: Record<string, LeagueFlipData> = {};

    for (const league of leagues) {
      const items = await this.fetchItemsByLeague(league);
      const currencies = await currencyRepository.fetchAll({
        league,
        type: currencyType,
      });

      result[league] = { items, currencies };
    }

    return result;
  }

  private async fetchItemsByLeague(
    league: string,
  ): Promise<ItemOverviewEntity[]> {
    const { itemRepository } = this.interfaces;
    const { itemTypes } = this.config;

    const items: ItemOverviewEntity[] = [];

    for (const type of itemTypes) {
      const fetched = await itemRepository.fetchAll({ league, type });
      items.push(...fetched);
    }

    return items;
  }
}
