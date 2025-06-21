import FirestoreFlipTableRepository from 'infra/firestore-flip-table.repository';
import HttpLeagueRepository from 'infra/http/league/league.repository';
import HttpItemOverviewRepository from 'infra/http/poe-ninja/item-overview.repository';
import HttpCurrencyOverviewRepository from 'infra/http/poe-ninja/currency-overview.repository';
import LeagueEntity from 'domain/entities/league.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import { ItemClass } from 'domain/entities/item-class.enum';

jest.mock('infra/firestore-flip-table.repository');
jest.mock('infra/http/league/league.repository');
jest.mock('infra/http/poe-ninja/item-overview.repository');
jest.mock('infra/http/poe-ninja/currency-overview.repository');

// Ensure main is not auto-executed during import by setting NODE_ENV to production
process.env.NODE_ENV = 'production';

describe('main flow', () => {
  let saveMock: jest.MockedFunction<any>;
  let fetchLeaguesMock: jest.MockedFunction<any>;
  let fetchItemsMock: jest.MockedFunction<any>;
  let fetchCurrenciesMock: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fresh mocks for each test without resetModules
    saveMock = jest.fn() as jest.MockedFunction<any>;
    saveMock.mockResolvedValue(undefined);
    (FirestoreFlipTableRepository as any).mockImplementation(() => ({ save: saveMock }));

    fetchLeaguesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpLeagueRepository as any).mockImplementation(() => ({ fetchAll: fetchLeaguesMock }));

    fetchItemsMock = jest.fn() as jest.MockedFunction<any>;
    (HttpItemOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchItemsMock }));

    fetchCurrenciesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpCurrencyOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchCurrenciesMock }));
  });

  it('fetches data and saves flip tables for leagues', async () => {
    // Arrange
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

    // Mock divination card that matches config/cards.ts
    const items = [
      new ItemOverviewEntity({
        chaosValue: 0, // Card costs 0 chaos
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10, // Set size of 10
      }),
      new ItemOverviewEntity({
        chaosValue: 10, // Reward worth 10 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    const { main } = await import('./index');

    // Act
    await main();

    // Assert
    expect(fetchLeaguesMock).toHaveBeenCalledTimes(1);
    expect(fetchItemsMock).toHaveBeenCalledWith({ league: 'Test', type: 'DivinationCard' });
    expect(fetchCurrenciesMock).toHaveBeenCalledWith({ league: 'Test', type: 'Currency' });
    expect(saveMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'The Wrath',
          chaosProfit: 10,
          costChaos: 0,
          resultChaos: 10,
          setSize: 10
        })
      ]), 
      'Test'
    );
  });

  it('handles leagues with no profitable opportunities', async () => {
    // Arrange
    const league = new LeagueEntity({
      delveEvent: false,
      endAt: null,
      id: 'NoProfit',
      realm: 'pc',
      rules: [],
      startAt: null,
      url: '',
    });
    fetchLeaguesMock.mockResolvedValue([league]);

    // Mock items with no profit - card costs more than reward
    const items = [
      new ItemOverviewEntity({
        chaosValue: 100, // Card costs 100 chaos
        detailsId: 'expensive-card',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 1, // Reward worth only 1 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);
    fetchCurrenciesMock.mockResolvedValue([]);

    const { main } = await import('./index');

    // Act
    await main();

    // Assert
    expect(saveMock).not.toHaveBeenCalled(); // No save should happen for unprofitable leagues
  });

  it('handles empty leagues gracefully', async () => {
    // Arrange
    fetchLeaguesMock.mockResolvedValue([]);
    const { main } = await import('./index');

    // Act
    await main();

    // Assert
    expect(fetchItemsMock).not.toHaveBeenCalled();
    expect(fetchCurrenciesMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('should skip leagues with no data available', async () => {
    // Arrange
    const league = new LeagueEntity({
      delveEvent: false,
      endAt: null,
      id: 'EmptyLeague',
      realm: 'pc',
      rules: [],
      startAt: null,
      url: '',
    });
    fetchLeaguesMock.mockResolvedValue([league]);

    // Mock empty league data - this simulates fetchFlipData returning no data for this league
    fetchItemsMock.mockResolvedValue([]);
    fetchCurrenciesMock.mockResolvedValue([]);

    const { main } = await import('./index');

    // Act
    await main();

    // Assert
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('should handle leagues with no profitable opportunities', async () => {
    // Arrange
    const league = new LeagueEntity({
      delveEvent: false,
      endAt: null,
      id: 'UnprofitableLeague',
      realm: 'pc',
      rules: [],
      startAt: null,
      url: '',
    });
    fetchLeaguesMock.mockResolvedValue([league]);

    // Mock unprofitable items (card costs more than reward)
    const items = [
      new ItemOverviewEntity({
        chaosValue: 100, // Expensive card
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 1, // Cheap reward
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    const { main } = await import('./index');

    // Act
    await main();

    // Assert
    expect(saveMock).not.toHaveBeenCalled();
  });
});

describe('error handling scenarios', () => {
  let saveMock: jest.MockedFunction<any>;
  let fetchLeaguesMock: jest.MockedFunction<any>;
  let fetchItemsMock: jest.MockedFunction<any>;
  let fetchCurrenciesMock: jest.MockedFunction<any>;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fresh mocks for each test without resetModules
    saveMock = jest.fn() as jest.MockedFunction<any>;
    (FirestoreFlipTableRepository as any).mockImplementation(() => ({ save: saveMock }));

    fetchLeaguesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpLeagueRepository as any).mockImplementation(() => ({ fetchAll: fetchLeaguesMock }));

    fetchItemsMock = jest.fn() as jest.MockedFunction<any>;
    (HttpItemOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchItemsMock }));

    fetchCurrenciesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpCurrencyOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchCurrenciesMock }));

    // Mock process.exit to prevent actual exit and capture calls
    exitSpy = jest.spyOn(process, 'exit');
    (exitSpy as any).mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    (exitSpy as any).mockRestore();
  });

  it('should handle Firestore API not enabled error (code 7)', async () => {
    // Arrange
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
        chaosValue: 0,
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 10,
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    // Mock Firestore API error
    const firestoreError = new Error('Cloud Firestore API has not been used') as any;
    firestoreError.code = 7;
    saveMock.mockRejectedValue(firestoreError);

    const { main } = await import('./index');

    // Act & Assert
    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle Firestore database not found error (code 5)', async () => {
    // Arrange
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
        chaosValue: 0,
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 10, // Reward worth 10 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    // Mock Firestore NOT_FOUND error
    const firestoreError = new Error('NOT_FOUND: Database not found') as any;
    firestoreError.code = 5;
    saveMock.mockRejectedValue(firestoreError);

    const { main } = await import('./index');

    // Act & Assert
    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle Firestore authentication error (code 16)', async () => {
    // Arrange
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
        chaosValue: 0,
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 10, // Reward worth 10 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    // Mock Firestore UNAUTHENTICATED error
    const firestoreError = new Error('UNAUTHENTICATED: Invalid credentials') as any;
    firestoreError.code = 16;
    saveMock.mockRejectedValue(firestoreError);

    const { main } = await import('./index');

    // Act & Assert
    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle general Firestore errors', async () => {
    // Arrange
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
        chaosValue: 0,
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 10, // Reward worth 10 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    // Mock general Firestore error
    const firestoreError = new Error('Firestore connection failed');
    saveMock.mockRejectedValue(firestoreError);

    const { main } = await import('./index');

    // Act & Assert
    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should re-throw unexpected errors that are not Firestore-related', async () => {
    // Arrange
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
        chaosValue: 0,
        detailsId: 'the-wrath',
        itemClass: ItemClass.DivinationCard,
        name: "The Wrath",
        stackSize: 10,
      }),
      new ItemOverviewEntity({
        chaosValue: 10, // Reward worth 10 chaos
        detailsId: 'chaos-orb',
        itemClass: ItemClass.Currency,
        name: "Chaos Orb",
      }),
    ];
    fetchItemsMock.mockResolvedValue(items);

    const currencies = [
      new CurrencyOverviewEntity({
        chaosEquivalent: 1,
        currencyTypeName: 'Chaos Orb',
        detailsId: 'chaos-orb',
      }),
    ];
    fetchCurrenciesMock.mockResolvedValue(currencies);

    // Mock non-Firestore error
    const unexpectedError = new Error('Network timeout');
    saveMock.mockRejectedValue(unexpectedError);

    const { main } = await import('./index');

    // Act & Assert
    await expect(main()).rejects.toThrow('Network timeout');
    // process.exit should NOT be called for non-Firestore errors
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('AWS Lambda handler', () => {
  let saveMock: jest.MockedFunction<any>;
  let fetchLeaguesMock: jest.MockedFunction<any>;
  let fetchItemsMock: jest.MockedFunction<any>;
  let fetchCurrenciesMock: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup fresh mocks for each test without resetModules
    saveMock = jest.fn() as jest.MockedFunction<any>;
    saveMock.mockResolvedValue(undefined);
    (FirestoreFlipTableRepository as any).mockImplementation(() => ({ save: saveMock }));

    fetchLeaguesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpLeagueRepository as any).mockImplementation(() => ({ fetchAll: fetchLeaguesMock }));

    fetchItemsMock = jest.fn() as jest.MockedFunction<any>;
    (HttpItemOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchItemsMock }));

    fetchCurrenciesMock = jest.fn() as jest.MockedFunction<any>;
    (HttpCurrencyOverviewRepository as any).mockImplementation(() => ({ fetchAll: fetchCurrenciesMock }));
  });

  it('should handle successful execution', async () => {
    // Arrange
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
    fetchItemsMock.mockResolvedValue([]);
    fetchCurrenciesMock.mockResolvedValue([]);

    const { handler } = await import('./index');
    const mockCallback = jest.fn();

    // Act
    await handler({} as any, {} as any, mockCallback);

    // Assert
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: JSON.stringify('Job done.'),
      statusCode: 200,
    });
  });

  it('should handle errors in handler', async () => {
    // Arrange
    fetchLeaguesMock.mockRejectedValue(new Error('API failure'));

    const { handler } = await import('./index');
    const mockCallback = jest.fn();

    // Act
    await handler({} as any, {} as any, mockCallback);

    // Assert
    expect(mockCallback).toHaveBeenCalledWith(
      expect.any(Error),
      {
        body: JSON.stringify('API failure'),
        statusCode: 500,
      }
    );
  });
});
