import FetchDivinationCardRewardsUseCase from 'application/use-cases/fetch-divination-card-rewards.use-case';
import { DivinationCardRewardType } from 'shared/helpers/parse-divination-card-reward.helper';
import type PoeNinjaService from 'infra/http/poe-ninja';

describe(FetchDivinationCardRewardsUseCase.name, () => {
  it('parses rewards from api', async () => {
    const lines = [
      {
        name: 'The Doctor',
        explicitModifiers: [{ text: '<uniqueitem>{Headhunter}' }],
      },
      {
        name: 'The Wrath',
        explicitModifiers: [{ text: '<currencyitem>{10x Chaos Orb}' }],
      },
      {
        name: 'Imperial Legacy',
        explicitModifiers: [{ text: '<whiteitem>{Six-Link Imperial Bow}' }],
      },
      {
        name: 'Hidden Socket',
        explicitModifiers: [{ text: '<whiteitem>{Six-Socket Staff}' }],
      },
      {
        name: 'Invalid',
        explicitModifiers: [{ text: 'Something else' }],
      },
    ];

    const service = {
      fetchItemOverview: jest.fn().mockResolvedValue({ lines }),
    } as unknown as PoeNinjaService;

    const useCase = new FetchDivinationCardRewardsUseCase({
      interfaces: { service },
    });
    const result = await useCase.execute('Sanctum');

    expect(service.fetchItemOverview).toHaveBeenCalledWith({
      league: 'Sanctum',
      type: 'DivinationCard',
    });
    expect(result).toEqual([
      {
        cardName: 'The Doctor',
        reward: {
          name: 'Headhunter',
          type: DivinationCardRewardType.UniqueItem,
          corrupted: false,
        },
      },
      {
        cardName: 'The Wrath',
        reward: {
          name: 'Chaos Orb',
          type: DivinationCardRewardType.CurrencyItem,
          corrupted: false,
          amount: 10,
        },
      },
      {
        cardName: 'Imperial Legacy',
        reward: {
          name: 'Imperial Bow',
          type: 'whiteitem',
          corrupted: false,
          links: 6,
        },
      },
      {
        cardName: 'Hidden Socket',
        reward: {
          name: 'Staff',
          type: 'whiteitem',
          corrupted: false,
          sockets: 6,
        },
      },
    ]);
  });

  it('throws when no lines returned', async () => {
    const service = {
      fetchItemOverview: jest.fn().mockResolvedValue({}),
    } as unknown as PoeNinjaService;

    const useCase = new FetchDivinationCardRewardsUseCase({
      interfaces: { service },
    });

    await expect(useCase.execute('Sanctum')).rejects.toThrow('No data found');
  });
});
