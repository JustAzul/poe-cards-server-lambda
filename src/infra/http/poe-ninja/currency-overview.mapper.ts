import { IHttpCurrencyOverviewMapper } from 'application/ports/mapper.interface';
import BuildEntityUseCase from 'application/use-cases/build-entity.use-case';
import { PoeNinjaCurrencyOverviewLine } from 'domain/entities/currency-overview.entity';

export default class HttpCurrencyOverviewMapper implements IHttpCurrencyOverviewMapper {
  constructor(
    private readonly entityBuilder: BuildEntityUseCase<'CurrencyOverviewEntity'>,
  ) {}

  toDomain(line: PoeNinjaCurrencyOverviewLine) {
    return this.entityBuilder.execute(line);
  }
}
