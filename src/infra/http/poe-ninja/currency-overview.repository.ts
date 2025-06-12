import { ICurrencyOverviewRepository } from 'application/ports/http-repository.interface';
import { IHttpCurrencyOverviewMapper } from 'application/ports/mapper.interface';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';
import InfraException from 'infra/exceptions/infra.exception';
import { PoeNinjaQueryParams } from './poe-ninja.service';
import PoeNinjaService from './poe-ninja.service';
import HttpCurrencyOverviewMapper from './currency-overview.mapper';
import { PoeNinjaCurrencyOverviewLine } from 'domain/entities/currency-overview.entity';

export default class HttpCurrencyOverviewRepository implements ICurrencyOverviewRepository {
  private readonly service: PoeNinjaService;

  private readonly mapper: IHttpCurrencyOverviewMapper;

  constructor(service: PoeNinjaService) {
    this.service = service;
    this.mapper = new HttpCurrencyOverviewMapper(
      new BuildEntityUseCase('CurrencyOverviewEntity'),
    );
  }

  async fetchAll(params: PoeNinjaQueryParams) {
    const { lines } = await this.service.fetchCurrencyOverview<{
      lines: PoeNinjaCurrencyOverviewLine[];
    }>(params);

    if (!lines) {
      throw new InfraException(
        `${HttpCurrencyOverviewRepository.name}#${this.fetchAll.name}`,
        'No data found',
      );
    }

    return lines.map((line) => this.mapper.toDomain(line));
  }
}
