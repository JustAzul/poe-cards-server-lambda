import ConsoleFlipTableRepository from 'infra/console-flip-table.repository';
import HttpLeagueRepository from 'infra/http/league/league.repository';
import HttpItemOverviewRepository from 'infra/http/poe-ninja/item-overview.repository';
import HttpCurrencyOverviewRepository from 'infra/http/poe-ninja/currency-overview.repository';
import LeagueEntity from 'domain/entities/league.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import { ItemClass } from 'domain/entities/item-class.enum';
import { main } from './index';

const saveMock = jest.fn();
const fetchLeaguesMock = jest.fn();
const fetchItemsMock = jest.fn();
const fetchCurrenciesMock = jest.fn();

jest.mock('infra/console-flip-table.repository', () => ({
  __esModule: true,
  default: jest.fn(() => ({ save: saveMock })),
}), { virtual: true });
jest.mock('infra/http/league/league.repository', () => ({
  __esModule: true,
  default: jest.fn(() => ({ fetchAll: fetchLeaguesMock })),
}), { virtual: true });
jest.mock('infra/http/poe-ninja/item-overview.repository', () => ({
  __esModule: true,
  default: jest.fn(() => ({ fetchAll: fetchItemsMock })),
}), { virtual: true });
jest.mock('infra/http/poe-ninja/currency-overview.repository', () => ({
  __esModule: true,
  default: jest.fn(() => ({ fetchAll: fetchCurrenciesMock })),
}), { virtual: true });

describe('main flow', () => {
  it('fetches data and saves flip tables for leagues', async () => {
    const league = new LeagueEntity({
      delveEvent: false,
      endAt: null,
      id: 'Test',
      realm: 'pc',
      rules: [],
      startAt: null,
      url: '',
    });
    fetchLeaguesMock.mockResolvedValue([league]);

    const items = [
      new ItemOverviewEntity({
        chaosValue: 2,
        detailsId: 'card',
        itemClass: ItemClass.DivinationCard,
        name: "The Wolven King's Bite",
        stackSize: 5,
      }),
      new ItemOverviewEntity({
        chaosValue: 10,
        detailsId: 'reward',
        itemClass: ItemClass.Unique,
        name: "Rigwald's Quills",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 200,
        currencyTypeName: 'Exalted Orb',
        detailsId: 'exalted-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    await main();

    expect(fetchLeaguesMock).toHaveBeenCalledTimes(1);
    expect(fetchItemsMock).toHaveBeenCalledWith({ league: 'Test', type: 'DivinationCard' });
    expect(fetchCurrenciesMock).toHaveBeenCalledWith({ league: 'Test', type: 'Currency' });
    expect(saveMock).toHaveBeenCalledWith(expect.any(Array), 'Test');
  });
});
