import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { ItemCard } from '@domain/entities/item-card.entity';
import { CurrencyCard } from '@domain/entities/currency-card.entity';
import { CardPriceResolver } from '../card.matcher';

describe('CardPriceResolver', () => {
  let matcher: CardPriceResolver;
  let items: ItemOverview[];
  let currency: CurrencyItem[];

  beforeEach(() => {
    matcher = new CardPriceResolver();
    items = [];
    currency = [];
  });

  describe('findCardPrice', () => {
    it('should find divination card by name and class', () => {
      const divinationCard: ItemOverview = {
        name: 'The Doctor',
        itemClass: 6,
        chaosValue: 100,
        count: 50,
      };

      items = [divinationCard];

      const result = matcher.findCardPrice(items, 'The Doctor');

      expect(result).toEqual(divinationCard);
    });

    it('should return null when card not found', () => {
      const otherCard: ItemOverview = {
        name: 'Other Card',
        itemClass: 6,
        chaosValue: 50,
        count: 20,
      };

      items = [otherCard];

      const result = matcher.findCardPrice(items, 'The Doctor');

      expect(result).toBeNull();
    });

    it('should not match cards with wrong itemClass', () => {
      const nonDivinationCard: ItemOverview = {
        name: 'The Doctor',
        itemClass: 4,
        chaosValue: 100,
        count: 50,
      };

      items = [nonDivinationCard];

      const result = matcher.findCardPrice(items, 'The Doctor');

      expect(result).toBeNull();
    });

    it('should not match currency items', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'The Doctor',
        chaosEquivalent: 100,
      };

      currency = [currencyItem];
      items = [];

      const result = matcher.findCardPrice(items, 'The Doctor');

      expect(result).toBeNull();
    });
  });

  describe('findRewardPrice - item cards', () => {
    it('should match item with exact criteria', () => {
      const targetItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      items = [targetItem];

      const cardDetails = new ItemCard('The Doctor', 'Headhunter', {
        iClass: 2,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(targetItem);
    });

    it('should match corrupted items correctly', () => {
      const corruptedItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 4000,
        count: 5,
        corrupted: true,
        links: 0,
        gemLevel: 0,
      };

      items = [corruptedItem];

      const cardDetails = new ItemCard('The Fiend', 'Headhunter', {
        iClass: 2,
        corrupted: true,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(corruptedItem);
    });

    it('should match items with specific link counts', () => {
      const linkedItem: ItemOverview = {
        name: 'Six-Link Chest',
        itemClass: 1,
        chaosValue: 300,
        count: 15,
        corrupted: false,
        links: 6,
        gemLevel: 0,
      };

      items = [linkedItem];

      const cardDetails = new ItemCard('The Chains that Bind', 'Six-Link Chest', {
        iClass: 1,
        corrupted: false,
        links: 6,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(linkedItem);
    });

    it('should match gems with specific levels', () => {
      const gem: ItemOverview = {
        name: 'Awakened Added Fire Damage Support',
        itemClass: 4,
        chaosValue: 200,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 5,
      };

      items = [gem];

      const cardDetails = new ItemCard('The Wretched', 'Awakened Added Fire Damage Support', {
        iClass: 4,
        corrupted: false,
        links: 0,
        gemLevel: 5,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(gem);
    });

    it('should return null when no matches exist', () => {
      const item: ItemOverview = {
        name: 'Other Item',
        itemClass: 2,
        chaosValue: 100,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      items = [item];

      const cardDetails = new ItemCard('The Doctor', 'Headhunter', {
        iClass: 2,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should return null when multiple matches exist (ambiguity)', () => {
      const item1: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      const item2: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 4800,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      items = [item1, item2];

      const cardDetails = new ItemCard('The Doctor', 'Headhunter', {
        iClass: 2,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match items with different corruption status', () => {
      const normalItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      items = [normalItem];

      const cardDetails = new ItemCard('The Fiend', 'Headhunter', {
        iClass: 2,
        corrupted: true,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match items with different link counts', () => {
      const fiveLinkItem: ItemOverview = {
        name: 'Chest Armor',
        itemClass: 1,
        chaosValue: 200,
        count: 15,
        corrupted: false,
        links: 5,
        gemLevel: 0,
      };

      items = [fiveLinkItem];

      const cardDetails = new ItemCard('The Chains that Bind', 'Chest Armor', {
        iClass: 1,
        corrupted: false,
        links: 6,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match gems with different levels', () => {
      const lowLevelGem: ItemOverview = {
        name: 'Awakened Added Fire Damage Support',
        itemClass: 4,
        chaosValue: 100,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 1,
      };

      items = [lowLevelGem];

      const cardDetails = new ItemCard('The Wretched', 'Awakened Added Fire Damage Support', {
        iClass: 4,
        corrupted: false,
        links: 0,
        gemLevel: 5,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should handle undefined optional properties as default values', () => {
      const item: ItemOverview = {
        name: 'Simple Item',
        itemClass: 2,
        chaosValue: 100,
        count: 10,
      };

      items = [item];

      const cardDetails = new ItemCard('Test Card', 'Simple Item', {
        iClass: 2,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(item);
    });

    it('should filter out currency items from item matching', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      currency = [currencyItem];
      items = [];

      const cardDetails = new ItemCard('Test Card', 'Chaos Orb', {
        iClass: 5,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });
  });

  describe('findRewardPrice - currency cards', () => {
    it('should match currency by currencyTypeName', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 150,
        receive: {
          count: 50,
        },
      };

      currency = [currencyItem];
      items = [];

      const cardDetails = new CurrencyCard('The Hoarder', 'Exalted Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(currencyItem);
    });

    it('should match Chaos Orb', () => {
      const chaosOrb: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      currency = [chaosOrb];
      items = [];

      const cardDetails = new CurrencyCard('Three Faces in the Dark', 'Chaos Orb', {
        amount: 3,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

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

      currency = [divineOrb];
      items = [];

      const cardDetails = new CurrencyCard('The Apothecary', 'Divine Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(divineOrb);
    });

    it('should return null when currency not found', () => {
      const otherCurrency: CurrencyItem = {
        currencyTypeName: 'Chromatic Orb',
        chaosEquivalent: 0.1,
      };

      currency = [otherCurrency];
      items = [];

      const cardDetails = new CurrencyCard('Test Card', 'Exalted Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match regular items when looking for currency', () => {
      const regularItem: ItemOverview = {
        name: 'Exalted Orb',
        itemClass: 5,
        chaosValue: 150,
        count: 50,
      };

      items = [regularItem];
      currency = [];

      const cardDetails = new CurrencyCard('Test Card', 'Exalted Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toBeNull();
    });

    it('should handle mixed league data correctly', () => {
      const regularItem: ItemOverview = {
        name: 'Exalted Orb',
        itemClass: 5,
        chaosValue: 150,
        count: 50,
      };

      const currencyItem: CurrencyItem = {
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 150,
        receive: {
          count: 50,
        },
      };

      items = [regularItem];
      currency = [currencyItem];

      const cardDetails = new CurrencyCard('The Hoarder', 'Exalted Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(currencyItem);
    });

    it('should match currency with multiple quantity', () => {
      const chaosOrb: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      currency = [chaosOrb];
      items = [];

      const cardDetails = new CurrencyCard('Three Faces in the Dark', 'Chaos Orb', {
        amount: 3,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(chaosOrb);
    });

    it('should handle currencies with receive data', () => {
      const mirrorOfKalandra: CurrencyItem = {
        currencyTypeName: 'Mirror of Kalandra',
        chaosEquivalent: 10000,
        receive: {
          count: 5,
        },
      };

      currency = [mirrorOfKalandra];
      items = [];

      const cardDetails = new CurrencyCard('House of Mirrors', 'Mirror of Kalandra', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(mirrorOfKalandra);
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

      currency = [currency1, currency2];
      items = [];

      const cardDetails = new CurrencyCard('The Hoarder', 'Exalted Orb', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, cardDetails);

      expect(result).toEqual(currency1);
    });
  });

  describe('type guard routing', () => {
    it('should route item cards to item matching logic', () => {
      const item: ItemOverview = {
        name: 'Test Item',
        itemClass: 2,
        chaosValue: 100,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      items = [item];
      currency = [];

      const itemCard = new ItemCard('Test Card', 'Test Item', {
        iClass: 2,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      });

      const result = matcher.findRewardPrice(items, currency, itemCard);

      expect(result).toEqual(item);
    });

    it('should route currency cards to currency matching logic', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'Test Currency',
        chaosEquivalent: 10,
      };

      currency = [currencyItem];
      items = [];

      const currencyCard = new CurrencyCard('Test Card', 'Test Currency', {
        amount: 1,
      });

      const result = matcher.findRewardPrice(items, currency, currencyCard);

      expect(result).toEqual(currencyItem);
    });
  });
});
