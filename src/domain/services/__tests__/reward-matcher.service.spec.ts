import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { DivinationCard } from '@domain/entities/card.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import {
  createCurrencyRewardSpec,
  createItemRewardSpec,
} from '@domain/value-objects/reward-spec';

function makeItem(overrides: Partial<{
  name: string;
  itemClass: number;
  chaosValue: number;
  corrupted: boolean;
  links: number;
  gemLevel: number;
  count: number;
}> = {}): ItemOverview {
  return new ItemOverview({
    name: 'Default Item',
    itemClass: ItemClass.UNIQUE,
    chaosValue: 100,
    ...overrides,
  });
}

function makeCurrency(name: string, chaosEquivalent = 100): CurrencyItem {
  return new CurrencyItem({
    currencyTypeName: name,
    chaosEquivalent,
    receive: { count: 10 },
  });
}

describe('RewardMatcherService', () => {
  let service: RewardMatcherService;

  beforeEach(() => {
    // eslint-disable-next-line no-empty-function
    const silentLogger = { warn: () => {}, log: () => {}, error: () => {} };
    service = new RewardMatcherService(silentLogger);
  });

  describe('findCardPrice', () => {
    it('should find card by name and divination card class', () => {
      const index = service.buildIndex([
        makeItem({ name: 'The Doctor', itemClass: ItemClass.DIVINATION_CARD, chaosValue: 1000 }),
        makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
      ], []);

      const result = service.findCardPrice(index, 'The Doctor');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('The Doctor');
      expect(result!.itemClass).toBe(ItemClass.DIVINATION_CARD);
    });

    it('should return null for non-existent card', () => {
      const index = service.buildIndex([
        makeItem({ name: 'The Doctor', itemClass: ItemClass.DIVINATION_CARD }),
      ], []);

      const result = service.findCardPrice(index, 'NonExistent');

      expect(result).toBeNull();
    });

    it('should ignore non-divination items with same name', () => {
      const index = service.buildIndex([
        makeItem({ name: 'The Doctor', itemClass: ItemClass.UNIQUE }),
      ], []);

      const result = service.findCardPrice(index, 'The Doctor');

      expect(result).toBeNull();
    });

    it('should return first match', () => {
      const index = service.buildIndex([
        makeItem({ name: 'The Doctor', itemClass: ItemClass.DIVINATION_CARD, chaosValue: 1000 }),
      ], []);

      const result = service.findCardPrice(index, 'The Doctor');

      expect(result).not.toBeNull();
      expect(result!.chaosValue).toBe(1000);
    });
  });

  describe('findRewardPrice', () => {
    describe('currency cards', () => {
      it('should match currency item by currencyTypeName', () => {
        const card = new DivinationCard('Abandoned Wealth', 'Exalted Orb', createCurrencyRewardSpec(3));
        const index = service.buildIndex([], [
          makeCurrency('Divine Orb'),
          makeCurrency('Exalted Orb', 50),
        ]);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(CurrencyItem);
        expect((result as CurrencyItem).currencyTypeName).toBe('Exalted Orb');
      });

      it('should return null when currency is not found', () => {
        const card = new DivinationCard('Test Card', 'Mirror of Kalandra', createCurrencyRewardSpec(1));
        const index = service.buildIndex([], [makeCurrency('Divine Orb')]);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });
    });

    describe('item cards', () => {
      it('should match item by name, itemClass, corrupted, links, and gemLevel', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect(result!).toBeInstanceOf(ItemOverview);
        expect((result as ItemOverview).name).toBe('Headhunter');
      });

      it('should return null when item name does not match', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Mageblood', itemClass: ItemClass.UNIQUE }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should return null when itemClass does not match', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.SKILL_GEM }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should return null when corruption status does not match', () => {
        const card = new DivinationCard(
          'Test Card',
          'Mageblood',
          createItemRewardSpec(ItemClass.UNIQUE, true, 0, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Mageblood', itemClass: ItemClass.UNIQUE, corrupted: false }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should return null when links do not match', () => {
        const card = new DivinationCard(
          'Test Card',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 6, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE, links: 0 }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should return null when gemLevel does not match', () => {
        const card = new DivinationCard(
          'Test Card',
          'Empower Support',
          createItemRewardSpec(ItemClass.SKILL_GEM, true, 0, 4),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Empower Support', itemClass: ItemClass.SKILL_GEM, corrupted: true, gemLevel: 3,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should return null and log warning when multiple items match', () => {
        const warnMessages: string[] = [];
        // eslint-disable-next-line no-empty-function, max-len
        const logger = { warn: (msg: string) => { warnMessages.push(msg); }, log: () => {}, error: () => {} };
        const serviceWithLogger = new RewardMatcherService(logger);

        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = serviceWithLogger.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
        ], []);

        const result = serviceWithLogger.findRewardPrice(index, card);

        expect(result).toBeNull();
        expect(warnMessages).toHaveLength(1);
        expect(warnMessages[0]).toContain('The Doctor');
        expect(warnMessages[0]).toContain('Headhunter');
        expect(warnMessages[0]).toContain('2');
      });

      it('should return null without crashing when ambiguous match occurs without callback', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
          makeItem({ name: 'Headhunter', itemClass: ItemClass.UNIQUE }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should match when optional fields default to false/0 on both sides', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
        );
        const index = service.buildIndex([
          new ItemOverview({
            name: 'Headhunter',
            itemClass: ItemClass.UNIQUE,
            chaosValue: 8000,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).name).toBe('Headhunter');
      });
    });
  });
});
