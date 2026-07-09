import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { DivinationCard } from '@domain/entities/card.entity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';
import {
  createCurrencyRewardSpec,
  createItemRewardSpec,
} from '@domain/value-objects/reward-spec';
import { ArbitrageMapper } from '@infrastructure/mappers/arbitrage.mapper';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCardOverview(
  overrides: Partial<ConstructorParameters<typeof ItemOverview>[0]> = {},
): ItemOverview {
  return new ItemOverview({
    name: 'The Doctor',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 500,
    count: 50,
    stackSize: 8,
    ...overrides,
  });
}

function buildProfit(
  overrides: Partial<ConstructorParameters<typeof ProfitResult>[0]> = {},
): ProfitResult {
  return new ProfitResult({
    chaosProfitValue: 1000,
    setChaosPrice: 4000,
    rewardChaosValue: 5000,
    roi: 25,
    ...overrides,
  });
}

function buildArbitrage(
  card: DivinationCard,
  cardPrice: ItemOverview,
  rewardPrice: ItemOverview | CurrencyItem,
  profit?: ProfitResult,
): ArbitrageOpportunity {
  const market = new MarketSnapshot({ cardPrice, rewardPrice, leagueId: 'Standard' });
  return new ArbitrageOpportunity({
    card,
    market,
    profit: profit ?? buildProfit(),
    trust: TrustValidation.valid(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ArbitrageMapper.toDto', () => {
  describe('meta handling', () => {
    it('should populate artFilename and flavour from meta when provided', () => {
      const card = new DivinationCard(
        'The Doctor',
        'Headhunter',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
      );
      const cardPrice = buildCardOverview({ name: 'The Doctor' });
      const rewardPrice = new ItemOverview({
        name: 'Headhunter',
        itemClass: ItemClass.UNIQUE,
        chaosValue: 5000,
        count: 20,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const meta: PoeNinjaItemMeta = {
        artFilename: 'Art/2DItems/Divination/TheDoctor.png',
        flavourText: 'Wealth beyond measure.',
      };

      const dto = ArbitrageMapper.toDto(arbitrage, meta);

      expect(dto.card.details.artFilename).toBe('Art/2DItems/Divination/TheDoctor.png');
      expect(dto.card.details.flavour).toBe('Wealth beyond measure.');
    });

    it('should default artFilename and flavour to empty strings when meta is omitted', () => {
      const card = new DivinationCard(
        'The Doctor',
        'Headhunter',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
      );
      const cardPrice = buildCardOverview({ name: 'The Doctor' });
      const rewardPrice = new ItemOverview({
        name: 'Headhunter',
        itemClass: ItemClass.UNIQUE,
        chaosValue: 5000,
        count: 20,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.artFilename).toBe('');
      expect(dto.card.details.flavour).toBe('');
    });
  });

  describe('reward display name', () => {
    it('should prefix amount when currency reward has amount > 1', () => {
      const card = new DivinationCard(
        'Brother\'s Gift',
        'Divine Orb',
        createCurrencyRewardSpec(3),
      );
      const cardPrice = buildCardOverview({ name: 'Brother\'s Gift', stackSize: 5 });
      const rewardPrice = new CurrencyItem({
        currencyTypeName: 'Divine Orb',
        chaosEquivalent: 200,
        volumePrimaryValue: 50,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.rewardName).toBe('3x Divine Orb');
      expect(dto.reward.name).toBe('3x Divine Orb');
    });

    it('should use bare name when currency reward amount is 1', () => {
      const card = new DivinationCard(
        'The Hoarder',
        'Divine Orb',
        createCurrencyRewardSpec(1),
      );
      const cardPrice = buildCardOverview({ name: 'The Hoarder', stackSize: 1 });
      const rewardPrice = new CurrencyItem({
        currencyTypeName: 'Divine Orb',
        chaosEquivalent: 200,
        volumePrimaryValue: 50,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.rewardName).toBe('Divine Orb');
      expect(dto.reward.name).toBe('Divine Orb');
    });

    it('should prefix level when reward is a skill gem', () => {
      const card = new DivinationCard(
        'Dialla\'s Subjugation',
        'Enlighten Support',
        createItemRewardSpec(ItemClass.SKILL_GEM, false, 0, 21),
      );
      const cardPrice = buildCardOverview({ name: 'Dialla\'s Subjugation', stackSize: 4 });
      const rewardPrice = new ItemOverview({
        name: 'Enlighten Support',
        itemClass: ItemClass.SKILL_GEM,
        chaosValue: 5000,
        count: 30,
        gemLevel: 21,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.rewardName).toBe('Level 21 Enlighten Support');
      expect(dto.reward.name).toBe('Level 21 Enlighten Support');
    });
  });

  describe('corrupted flag', () => {
    it('should set isCorrupted to true when item reward is corrupted', () => {
      const card = new DivinationCard(
        'Corrupted Card',
        'Corrupted Item',
        createItemRewardSpec(ItemClass.UNIQUE, true, 6, 0),
      );
      const cardPrice = buildCardOverview({ name: 'Corrupted Card' });
      const rewardPrice = new ItemOverview({
        name: 'Corrupted Item',
        itemClass: ItemClass.UNIQUE,
        chaosValue: 3000,
        count: 15,
        corrupted: true,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.isCorrupted).toBe(true);
    });

    it('should set isCorrupted to false when reward is a CurrencyItem', () => {
      const card = new DivinationCard(
        'The Hoarder',
        'Chaos Orb',
        createCurrencyRewardSpec(1),
      );
      const cardPrice = buildCardOverview({ name: 'The Hoarder', stackSize: 1 });
      const rewardPrice = new CurrencyItem({
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.details.isCorrupted).toBe(false);
    });
  });

  describe('stack size', () => {
    it('should default stack to 1 when cardPrice.stackSize is undefined', () => {
      const card = new DivinationCard(
        'The Gambler',
        'Chaos Orb',
        createCurrencyRewardSpec(1),
      );
      // stackSize intentionally omitted
      const cardPrice = new ItemOverview({
        name: 'The Gambler',
        itemClass: ItemClass.DIVINATION_CARD,
        chaosValue: 5,
        count: 200,
      });
      const rewardPrice = new CurrencyItem({
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.stack).toBe(1);
    });
  });

  describe('field mapping', () => {
    it('should map all scalar fields correctly for an item card', () => {
      const card = new DivinationCard(
        'The Doctor',
        'Headhunter',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
      );
      const cardPrice = buildCardOverview({
        name: 'The Doctor',
        chaosValue: 500,
        stackSize: 8,
      });
      const rewardPrice = new ItemOverview({
        name: 'Headhunter',
        itemClass: ItemClass.UNIQUE,
        chaosValue: 5000,
        count: 20,
      });
      const profit = buildProfit({
        chaosProfitValue: 1000,
        setChaosPrice: 4000,
        rewardChaosValue: 5000,
        roi: 25,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice, profit);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.card.name).toBe('The Doctor');
      expect(dto.card.chaosPrice).toBe(500);
      expect(dto.card.stack).toBe(8);
      expect(dto.card.details.rewardClass).toBe(ItemClass.UNIQUE);
      expect(dto.reward.chaosPrice).toBe(5000);
      expect(dto.setChaosPrice).toBe(4000);
      expect(dto.chaosProfit).toBe(1000);
      expect(dto.isCurrency).toBe(false);
    });

    it('should set isCurrency to true and rewardClass to null for currency cards', () => {
      const card = new DivinationCard(
        'The Hoarder',
        'Exalted Orb',
        createCurrencyRewardSpec(1),
      );
      const cardPrice = buildCardOverview({ name: 'The Hoarder', stackSize: 1 });
      const rewardPrice = new CurrencyItem({
        currencyTypeName: 'Exalted Orb',
        chaosEquivalent: 300,
        volumePrimaryValue: 50,
      });
      const arbitrage = buildArbitrage(card, cardPrice, rewardPrice);

      const dto = ArbitrageMapper.toDto(arbitrage);

      expect(dto.isCurrency).toBe(true);
      expect(dto.card.details.rewardClass).toBeNull();
    });
  });
});
