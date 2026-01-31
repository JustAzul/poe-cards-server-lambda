import { ExactCurrencyMatcher } from '../exact-currency.matcher';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CurrencyCard } from '@domain/entities/card.entity';

describe('ExactCurrencyMatcher', () => {
  let matcher: ExactCurrencyMatcher;
  let mockLeagueData: Array<ItemOverview | CurrencyItem>;

  beforeEach(() => {
    matcher = new ExactCurrencyMatcher();
    mockLeagueData = [];
  });

  describe('matchCard', () => {
    it('should find divination card by name and class', () => {
      const divinationCard: ItemOverview = {
        name: 'The Gambler',
        itemClass: 6,
        chaosValue: 1,
        count: 100,
      };

      mockLeagueData = [divinationCard];

      const result = matcher.matchCard(mockLeagueData, 'The Gambler');

      expect(result).toEqual(divinationCard);
    });

    it('should return null when card not found', () => {
      const otherCard: ItemOverview = {
        name: 'Other Card',
        itemClass: 6,
        chaosValue: 50,
        count: 20,
      };

      mockLeagueData = [otherCard];

      const result = matcher.matchCard(mockLeagueData, 'The Gambler');

      expect(result).toBeNull();
    });

    it('should not match cards with wrong itemClass', () => {
      const nonDivinationCard: ItemOverview = {
        name: 'The Gambler',
        itemClass: 4,
        chaosValue: 1,
        count: 100,
      };

      mockLeagueData = [nonDivinationCard];

      const result = matcher.matchCard(mockLeagueData, 'The Gambler');

      expect(result).toBeNull();
    });

    it('should not match currency items when looking for cards', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'The Gambler',
        chaosEquivalent: 1,
      };

      mockLeagueData = [currencyItem];

      const result = matcher.matchCard(mockLeagueData, 'The Gambler');

      expect(result).toBeNull();
    });
  });

  describe('matchReward', () => {
    it('should match currency by currencyTypeName', () => {
      const currency: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 150,
        receive: {
          count: 50,
        },
      };

      mockLeagueData = [currency];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'The Hoarder',
        reward: 'Exalted Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(currency);
    });

    it('should match Chaos Orb', () => {
      const chaosOrb: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      mockLeagueData = [chaosOrb];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'Three Faces in the Dark',
        reward: 'Chaos Orb',
        rewardSpec: {
          amount: 3,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(chaosOrb);
    });

    it('should match Divine Orb', () => {
      const divineOrb: CurrencyItem = {
        currencyTypeName: 'Divine Orb',
        chaosEquivalent: 200,
        receive: {
          count: 30,
        },
      };

      mockLeagueData = [divineOrb];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'The Apothecary',
        reward: 'Divine Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(divineOrb);
    });

    it('should return null when currency not found', () => {
      const otherCurrency: CurrencyItem = {
        currencyTypeName: 'Chromatic Orb',
        chaosEquivalent: 0.1,
      };

      mockLeagueData = [otherCurrency];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'Test Card',
        reward: 'Exalted Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match regular items when looking for currency', () => {
      const regularItem: ItemOverview = {
        name: 'Exalted Orb',
        itemClass: 5,
        chaosValue: 150,
        count: 50,
      };

      mockLeagueData = [regularItem];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'Test Card',
        reward: 'Exalted Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should handle mixed league data correctly', () => {
      const regularItem: ItemOverview = {
        name: 'Exalted Orb',
        itemClass: 5,
        chaosValue: 150,
        count: 50,
      };

      const currency: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 150,
        receive: {
          count: 50,
        },
      };

      mockLeagueData = [regularItem, currency];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'The Hoarder',
        reward: 'Exalted Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(currency);
    });

    it('should match currency with multiple quantity', () => {
      const currency: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      mockLeagueData = [currency];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'Three Faces in the Dark',
        reward: 'Chaos Orb',
        rewardSpec: {
          amount: 3,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(currency);
    });

    it('should handle currencies with receive data', () => {
      const currency: CurrencyItem = {
        currencyTypeName: 'Mirror of Kalandra',
        chaosEquivalent: 10000,
        receive: {
          count: 5,
        },
      };

      mockLeagueData = [currency];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'House of Mirrors',
        reward: 'Mirror of Kalandra',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(currency);
    });

    it('should return first matching currency when multiple exist', () => {
      const currency1: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 150,
      };

      const currency2: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 148,
      };

      mockLeagueData = [currency1, currency2];

      const cardDetails: CurrencyCard = {
        type: 'currency',
        name: 'The Hoarder',
        reward: 'Exalted Orb',
        rewardSpec: {
          amount: 1,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(currency1);
    });
  });
});
