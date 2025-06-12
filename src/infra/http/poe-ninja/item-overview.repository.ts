import { IItemOverviewRepository } from 'application/ports/http-repository.interface';
import { IHttpItemOverviewMapper } from 'application/ports/mapper.interface';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';
import InfraException from 'infra/exceptions/infra.exception';
import { PoeNinjaQueryParams } from './poe-ninja.service';
import PoeNinjaService from './poe-ninja.service';
import HttpItemOverviewMapper from './item-overview.mapper';
import { PoeNinjaItemOverviewLine } from 'domain/entities/item-overview.entity';

export default class HttpItemOverviewRepository implements IItemOverviewRepository {
  private readonly service: PoeNinjaService;

  private readonly mapper: IHttpItemOverviewMapper;

  constructor(service: PoeNinjaService) {
    this.service = service;
    this.mapper = new HttpItemOverviewMapper(
      new BuildEntityUseCase('ItemOverviewEntity'),
    );
  }

  async fetchAll(params: PoeNinjaQueryParams) {
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
}
