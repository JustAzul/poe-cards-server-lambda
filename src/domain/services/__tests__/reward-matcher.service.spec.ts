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
    volumePrimaryValue: 10,
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
      it('should synthesize Chaos Orb in market index when not present in currency data', () => {
        const card = new DivinationCard(
          'Rain of Chaos',
          'Chaos Orb',
          createCurrencyRewardSpec(1),
        );
        const index = service.buildIndex([], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect(result).toBeInstanceOf(CurrencyItem);
        expect((result as CurrencyItem).currencyTypeName).toBe('Chaos Orb');
        expect((result as CurrencyItem).chaosEquivalent).toBe(1);
      });

      it('should not overwrite Chaos Orb if already present in currency data', () => {
        const card = new DivinationCard(
          'Rain of Chaos',
          'Chaos Orb',
          createCurrencyRewardSpec(1),
        );
        const existingChaosOrb = new CurrencyItem({
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
          volumePrimaryValue: 999,
        });
        const index = service.buildIndex([], [existingChaosOrb]);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeInstanceOf(CurrencyItem);
        expect((result as CurrencyItem).getVolume()).toBe(999);
      });

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
      it('should match unique item reward by name and itemClass', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
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
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
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
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Headhunter', itemClass: ItemClass.SKILL_GEM }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should match corrupted unique reward against uncorrupted market data', () => {
        // poe.ninja returns corrupted: undefined for all uniques — corruption is ignored
        // for non-gem items because the API doesn't differentiate pricing by corruption
        const card = new DivinationCard(
          'Test Card',
          'Mageblood',
          createItemRewardSpec(ItemClass.UNIQUE, true, 0),
        );
        const index = service.buildIndex([
          makeItem({ name: 'Mageblood', itemClass: ItemClass.UNIQUE }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).name).toBe('Mageblood');
      });

      it('should still enforce corruption matching for skill gems', () => {
        // poe.ninja tracks corruption for gems (Vaal gems have corrupted: true)
        const card = new DivinationCard(
          'Test Card',
          'Empower Support',
          createItemRewardSpec(ItemClass.SKILL_GEM, true, 4),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Empower Support', itemClass: ItemClass.SKILL_GEM, corrupted: false, gemLevel: 4,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should match a linked gem listing (gems have no link count in-game)', () => {
        const card = new DivinationCard(
          'Test Card',
          'Empower Support',
          createItemRewardSpec(ItemClass.SKILL_GEM, true, 4),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Empower Support',
            itemClass: ItemClass.SKILL_GEM,
            corrupted: true,
            gemLevel: 4,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).name).toBe('Empower Support');
      });

      it('should return null when a non-gem item\'s only listing is linked (no base variant)', () => {
        // No divination-card mechanic grants a pre-linked unique, so a linked-only
        // listing is never the correct price for this reward — better to report
        // "no price" than silently value the card off the wrong (linked) tier.
        const card = new DivinationCard(
          'Humility',
          'Tabula Rasa',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Tabula Rasa',
            itemClass: ItemClass.UNIQUE,
            links: 6,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should prefer the 0-link variant when a unique has multiple link-tier listings', () => {
        // Regression: divination cards never grant a pre-linked unique — poe.ninja
        // can list the same name at several link tiers with wildly different prices
        // (e.g. "The Searing Touch": None/6/5/6/None), and the old highest-count
        // tie-break could silently pick a far more expensive linked variant.
        const warnMessages: string[] = [];
        // eslint-disable-next-line no-empty-function, max-len
        const logger = { warn: (msg: string) => { warnMessages.push(msg); }, log: () => {}, error: () => {} };
        const serviceWithLogger = new RewardMatcherService(logger);

        const card = new DivinationCard(
          'Test Card',
          'The Searing Touch',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = serviceWithLogger.buildIndex([
          makeItem({
            name: 'The Searing Touch', itemClass: ItemClass.UNIQUE, chaosValue: 267560, links: 6, count: 40,
          }),
          makeItem({
            name: 'The Searing Touch', itemClass: ItemClass.UNIQUE, chaosValue: 45, count: 3,
          }),
        ], []);

        const result = serviceWithLogger.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).chaosValue).toBe(45);
        expect(warnMessages).toHaveLength(1);
        expect(warnMessages[0]).toContain('link-tier variants');
        expect(warnMessages[0]).toContain('0-link/base variant');
      });

      it('should return null when no 0-link variant exists among several linked listings', () => {
        const warnMessages: string[] = [];
        // eslint-disable-next-line no-empty-function, max-len
        const logger = { warn: (msg: string) => { warnMessages.push(msg); }, log: () => {}, error: () => {} };
        const serviceWithLogger = new RewardMatcherService(logger);

        const card = new DivinationCard(
          'Test Card',
          'The Searing Touch',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = serviceWithLogger.buildIndex([
          makeItem({
            name: 'The Searing Touch', itemClass: ItemClass.UNIQUE, chaosValue: 267560, links: 6, count: 40,
          }),
          makeItem({
            name: 'The Searing Touch', itemClass: ItemClass.UNIQUE, chaosValue: 180000, links: 5, count: 10,
          }),
        ], []);

        const result = serviceWithLogger.findRewardPrice(index, card);

        expect(result).toBeNull();
        expect(warnMessages.some((m) => m.includes('no 0-link/base variant') || m.includes('no valid price'))).toBe(true);
      });

      it('should match relic variant (itemClass 10) for unique rewards', () => {
        const card = new DivinationCard(
          'Father\'s Love',
          'Sublime Vision',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Sublime Vision',
            itemClass: ItemClass.RELIC,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).name).toBe('Sublime Vision');
      });

      it('should return null when gemLevel does not match', () => {
        const card = new DivinationCard(
          'Test Card',
          'Empower Support',
          createItemRewardSpec(ItemClass.SKILL_GEM, true, 4),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Empower Support', itemClass: ItemClass.SKILL_GEM, corrupted: true, gemLevel: 3,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).toBeNull();
      });

      it('should log warning and return highest-count entry when multiple items match', () => {
        const warnMessages: string[] = [];
        // eslint-disable-next-line no-empty-function, max-len
        const logger = { warn: (msg: string) => { warnMessages.push(msg); }, log: () => {}, error: () => {} };
        const serviceWithLogger = new RewardMatcherService(logger);

        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = serviceWithLogger.buildIndex([
          makeItem({
            name: 'Headhunter', itemClass: ItemClass.UNIQUE, chaosValue: 100, count: 50,
          }),
          makeItem({
            name: 'Headhunter', itemClass: ItemClass.UNIQUE, chaosValue: 1, count: 100,
          }),
        ], []);

        const result = serviceWithLogger.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).count).toBe(100);
        expect(warnMessages).toHaveLength(1);
        expect(warnMessages[0]).toContain('The Doctor');
        expect(warnMessages[0]).toContain('Headhunter');
        expect(warnMessages[0]).toContain('2');
        expect(warnMessages[0]).toContain('using highest-count entry');
      });

      it('should pick highest chaosValue when counts are equal in ambiguous match', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );
        const index = service.buildIndex([
          makeItem({
            name: 'Headhunter', itemClass: ItemClass.UNIQUE, chaosValue: 100, count: 50,
          }),
          makeItem({
            name: 'Headhunter', itemClass: ItemClass.UNIQUE, chaosValue: 500, count: 50,
          }),
        ], []);

        const result = service.findRewardPrice(index, card);

        expect(result).not.toBeNull();
        expect((result as ItemOverview).chaosValue).toBe(500);
      });

      it('should match when optional fields default to false/0 on both sides', () => {
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
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
