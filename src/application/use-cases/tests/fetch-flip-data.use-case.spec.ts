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
  const mockItem = new ItemOverviewEntity({
    chaosValue: 1,
    detailsId: 'a',
    name: 'ItemA',
  });
  const mockCurrency = new CurrencyOverviewEntity({
    chaosEquivalent: 1,
    currencyTypeName: 'Chaos Orb',
    detailsId: 'chaos-orb',
  });

  let itemRepository: IItemOverviewRepository;
  let currencyRepository: ICurrencyOverviewRepository;
  let useCase: FetchFlipDataUseCase;

  beforeEach(() => {
    itemRepository = {
      fetchAll: jest.fn().mockResolvedValue([mockItem]),
      fetchByNames: jest.fn(),
    };
    currencyRepository = {
      fetchAll: jest.fn().mockResolvedValue([mockCurrency]),
    };
    useCase = new FetchFlipDataUseCase({
      interfaces: { itemRepository, currencyRepository },
      config: { itemTypes },
    });
  });

  it('should aggregate data for multiple leagues in parallel', async () => {
    const leagues = ['Sanctum', 'Standard'];
    const result = await useCase.execute(leagues);

    expect(Object.keys(result)).toEqual(leagues);
    expect(result.Sanctum.items).toEqual([mockItem]);
    expect(result.Standard.currencies).toEqual([mockCurrency]);

    expect(itemRepository.fetchAll).toHaveBeenCalledTimes(leagues.length);
    expect(currencyRepository.fetchAll).toHaveBeenCalledTimes(leagues.length);
  });

  it('should not throw if one league fails, but return successful ones', async () => {
    const leagues = ['Sanctum', 'FailureLeague', 'Standard'];
    console.error = jest.fn(); // Suppress console.error logging for this test

    // Make one of the calls fail
    (itemRepository.fetchAll as jest.Mock).mockImplementation(({ league }: { league: string }) => {
      if (league === 'FailureLeague') {
        return Promise.reject(new Error('API Down'));
      }
      return Promise.resolve([mockItem]);
    });

    const result = await useCase.execute(leagues);

    expect(Object.keys(result)).toEqual(['Sanctum', 'Standard']);
    expect(result.Sanctum).toBeDefined();
    expect(result.Standard).toBeDefined();
    expect(result.FailureLeague).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch data for a league:',
      new Error('API Down'),
    );
  });

  it('should not include leagues that return no data', async () => {
    const leagues = ['Sanctum', 'EmptyLeague'];

    (itemRepository.fetchAll as jest.Mock).mockImplementation(({ league }: { league: string }) => {
      if (league === 'EmptyLeague') {
        return Promise.resolve([]); // No items found
      }
      return Promise.resolve([mockItem]);
    });

    const result = await useCase.execute(leagues);

    expect(Object.keys(result)).toEqual(['Sanctum']);
    expect(result.Sanctum).toBeDefined();
    expect(result.EmptyLeague).toBeUndefined();
  });
});
