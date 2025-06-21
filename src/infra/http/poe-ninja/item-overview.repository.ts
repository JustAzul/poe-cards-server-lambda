import {
  IItemOverviewRepository,
  PoeNinjaDynamicItemOverviewQueryParams,
  PoeNinjaItemOverviewQueryParams,
} from 'application/ports/http-repository.interface';
import { IHttpItemOverviewMapper } from 'application/ports/mapper.interface';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';
import FETCH_LIST from 'config/fetch-list';
import InfraException from 'infra/exceptions/infra.exception';
import PoeNinjaService from './poe-ninja.service';
import HttpItemOverviewMapper from './item-overview.mapper';
import ItemOverviewEntity, {
  PoeNinjaItemOverviewLine,
} from 'domain/entities/item-overview.entity';

export default class HttpItemOverviewRepository implements IItemOverviewRepository {
  private readonly service: PoeNinjaService;

  private readonly mapper: IHttpItemOverviewMapper;

  constructor(service: PoeNinjaService) {
    this.service = service;
    this.mapper = new HttpItemOverviewMapper(
      new BuildEntityUseCase('ItemOverviewEntity'),
    );
  }

  async fetchAll(
    params: PoeNinjaItemOverviewQueryParams,
  ): Promise<ItemOverviewEntity[]> {
    const { lines } = await this.service.fetchItemOverview<{
      lines: PoeNinjaItemOverviewLine[];
    }>(params);

    if (!lines) {
      throw new InfraException(
        `${HttpItemOverviewRepository.name}#${this.fetchAll.name}`,
        'No data found',
      );
    }

    return lines.map((line) => this.mapper.toDomain(line));
  }

  async fetchByNames(
    params: PoeNinjaDynamicItemOverviewQueryParams,
  ): Promise<ItemOverviewEntity[]> {
    const { league, itemNames } = params;
    const itemNamesSet = new Set(itemNames);

    const promises = FETCH_LIST.map((type) => this.fetchAll({ league, type }));
    const settledResults = await Promise.allSettled(promises);

    const allItems = settledResults
      .filter((res) => res.status === 'fulfilled')
      .flatMap((res) => (res as PromiseFulfilledResult<ItemOverviewEntity[]>)
          .value,
      );
    
    return allItems.filter((item) => itemNamesSet.has(item.name));
  }
}
