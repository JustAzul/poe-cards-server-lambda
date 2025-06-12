import { IHttpItemOverviewMapper } from '../../../application/ports/mapper.interface';
import BuildEntityUseCase from '../../../application/use-cases/build-entity.use-case';
import { PoeNinjaItemOverviewLine } from '../../../domain/entities/item-overview.entity';

export default class HttpItemOverviewMapper implements IHttpItemOverviewMapper {
  constructor(
    private readonly entityBuilder: BuildEntityUseCase<'ItemOverviewEntity'>,
  ) {}

  toDomain(line: PoeNinjaItemOverviewLine) {
    return this.entityBuilder.execute(line);
  }
}
