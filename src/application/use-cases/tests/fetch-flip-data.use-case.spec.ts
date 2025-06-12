import FetchFlipDataUseCase from 'application/use-cases/fetch-flip-data.use-case';
import { ItemOverviewType } from 'config/fetch-list';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';
import {
  ICurrencyOverviewRepository,
  IItemOverviewRepository,
} from 'application/ports/http-repository.interface';

const league = 'Sanctum';
const itemTypes: ItemOverviewType[] = ['DivinationCard'];

describe(FetchFlipDataUseCase.name, () => {
  it('aggregates data for each league', async () => {
    const itemEntities = [
      new ItemOverviewEntity({
        chaosValue: 1,
        detailsId: 'a',
        name: 'ItemA',
      }),
    ];
    const currencyEntities = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];

    const itemRepository: IItemOverviewRepository = {
      fetchAll: jest.fn().mockResolvedValue(itemEntities),
    };
    const currencyRepository: ICurrencyOverviewRepository = {
      fetchAll: jest.fn().mockResolvedValue(currencyEntities),
    };

    const useCase = new FetchFlipDataUseCase({
      interfaces: { itemRepository, currencyRepository },
      config: { itemTypes },
    });

    const result = await useCase.execute([league]);

    expect(result[league].items).toEqual(itemEntities);
    expect(result[league].currencies).toEqual(currencyEntities);
    expect(itemRepository.fetchAll).toHaveBeenCalledWith({ league, type: 'DivinationCard' });
    expect(currencyRepository.fetchAll).toHaveBeenCalledWith({ league, type: 'Currency' });
  });

  it('throws when item repository fails', async () => {
    const itemRepository: IItemOverviewRepository = {
      fetchAll: jest.fn().mockRejectedValue(new Error('fail')),
    };
    const currencyRepository: ICurrencyOverviewRepository = {
      fetchAll: jest.fn(),
    };

    const useCase = new FetchFlipDataUseCase({
      interfaces: { itemRepository, currencyRepository },
      config: { itemTypes },
    });

    await expect(useCase.execute([league])).rejects.toThrow('fail');
  });

  it('throws when currency repository fails', async () => {
    const itemRepository: IItemOverviewRepository = {
      fetchAll: jest.fn().mockResolvedValue([]),
    };
    const currencyRepository: ICurrencyOverviewRepository = {
      fetchAll: jest.fn().mockRejectedValue(new Error('fail')),
    };

    const useCase = new FetchFlipDataUseCase({
      interfaces: { itemRepository, currencyRepository },
      config: { itemTypes },
    });

    await expect(useCase.execute([league])).rejects.toThrow('fail');
  });
});
