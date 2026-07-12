import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';
import { createItemRewardSpec, createCurrencyRewardSpec } from '@domain/value-objects/reward-spec';
import { IArbitrageEvaluator } from '@domain/ports/arbitrage-evaluator.port';
import { TransformAdapter } from '@infrastructure/adapters/etl/transform.adapter';
import { PoeNinjaItemMeta } from '@infrastructure/types/poe-ninja-item-meta';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-empty-function
const silentLogger = { log: () => {}, warn: () => {}, error: () => {} };

function buildCard(name = 'The Doctor'): DivinationCard {
  return new DivinationCard(name, 'Headhunter', createItemRewardSpec(ItemClass.UNIQUE, false, 0));
}

function buildCurrencyCard(name = 'The Hoarder'): DivinationCard {
  return new DivinationCard(name, 'Chaos Orb', createCurrencyRewardSpec(1));
}

function buildCardPrice(name = 'The Doctor'): ItemOverview {
  return new ItemOverview({
    name,
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 500,
    count: 50,
    stackSize: 8,
  });
}

function buildRewardPrice(): ItemOverview {
  return new ItemOverview({
    name: 'Headhunter',
    itemClass: ItemClass.UNIQUE,
    chaosValue: 5000,
    count: 20,
  });
}

function buildArbitrageOpportunity(card: DivinationCard): ArbitrageOpportunity {
  const market = new MarketSnapshot({
    cardPrice: buildCardPrice(card.name),
    rewardPrice: buildRewardPrice(),
    leagueId: 'Standard',
  });
  const profit = new ProfitResult({
    chaosProfitValue: 1000,
    setChaosPrice: 4000,
    rewardChaosValue: 5000,
    roi: 25,
  });
  return new ArbitrageOpportunity({
    card,
    market,
    profit,
    trust: TrustValidation.valid(),
  });
}

function makeArbitrageEvaluator(
  opportunities: ArbitrageOpportunity[] = [],
): jest.Mocked<IArbitrageEvaluator> {
  return {
    evaluateCardArbitrage: jest.fn(),
    findAllArbitrageOpportunities: jest.fn().mockReturnValue(opportunities),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransformAdapter.transform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('profitTable mapping', () => {
    it('should return profitTable with one row per arbitrage opportunity', () => {
      const card = buildCard('The Doctor');
      const opportunity = buildArbitrageOpportunity(card);
      const evaluator = makeArbitrageEvaluator([opportunity]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      const result = adapter.transform(
        'Standard',
        [buildCardPrice()],
        [],
        [card],
        new Map<string, PoeNinjaItemMeta>(),
      );

      expect(result.profitTable).toHaveLength(1);
      expect(result.profitTable[0].card.name).toBe('The Doctor');
    });

    it('should map arbitrage opportunities to DTOs using ArbitrageMapper', () => {
      const card = buildCard('The Doctor');
      const opportunity = buildArbitrageOpportunity(card);
      const evaluator = makeArbitrageEvaluator([opportunity]);

      const meta: PoeNinjaItemMeta = {
        artFilename: 'Art/2DItems/Divination/TheDoctor.png',
        flavourText: 'Wealth beyond measure.',
      };
      const itemMeta = new Map<string, PoeNinjaItemMeta>([['The Doctor', meta]]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      const result = adapter.transform(
        'Standard',
        [buildCardPrice()],
        [],
        [card],
        itemMeta,
      );

      const row = result.profitTable[0];
      expect(row.card.details.artFilename).toBe('Art/2DItems/Divination/TheDoctor.png');
      expect(row.card.details.flavour).toBe('Wealth beyond measure.');
    });

    it('should pass currency items through unchanged as result.currency', () => {
      const currency = [
        new CurrencyItem({ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 }),
        new CurrencyItem({ currencyTypeName: 'Divine Orb', chaosEquivalent: 200 }),
      ];
      const evaluator = makeArbitrageEvaluator([]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      const result = adapter.transform(
        'Standard',
        [],
        currency,
        [],
        new Map<string, PoeNinjaItemMeta>(),
      );

      expect(result.currency).toBe(currency);
    });
  });

  describe('empty evaluator results', () => {
    it('should produce an empty profitTable when evaluator returns no opportunities', () => {
      const evaluator = makeArbitrageEvaluator([]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      const result = adapter.transform(
        'Standard',
        [],
        [],
        [buildCard()],
        new Map<string, PoeNinjaItemMeta>(),
      );

      expect(result.profitTable).toHaveLength(0);
    });
  });

  describe('evaluator invocation', () => {
    it('should call findAllArbitrageOpportunities with items, currency, and cards', () => {
      const items = [buildCardPrice()];
      const currency = [new CurrencyItem({ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 })];
      const cards = [buildCard(), buildCurrencyCard()];
      const evaluator = makeArbitrageEvaluator([]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      adapter.transform(
        'Settlers',
        items,
        currency,
        cards,
        new Map<string, PoeNinjaItemMeta>(),
      );

      expect(evaluator.findAllArbitrageOpportunities).toHaveBeenCalledTimes(1);
      expect(evaluator.findAllArbitrageOpportunities).toHaveBeenCalledWith(
        { league: 'Settlers', items, currency },
        cards,
      );
    });

    it('should pass itemMeta to ArbitrageMapper so DTO includes correct meta fields', () => {
      const card = buildCard('The Hoarder');
      const opportunity = buildArbitrageOpportunity(card);
      const evaluator = makeArbitrageEvaluator([opportunity]);

      const meta: PoeNinjaItemMeta = {
        artFilename: 'Art/TheHoarder.png',
        flavourText: 'Orbs.',
      };
      const itemMeta = new Map<string, PoeNinjaItemMeta>([['The Hoarder', meta]]);

      const adapter = new TransformAdapter(evaluator, silentLogger);
      const result = adapter.transform('Standard', [], [], [card], itemMeta);

      expect(result.profitTable[0].card.details.artFilename).toBe('Art/TheHoarder.png');
    });
  });

  describe('logging', () => {
    it('should log the league name during transform', () => {
      const logger = {
        // eslint-disable-next-line no-empty-function
        log: jest.fn(),
        // eslint-disable-next-line no-empty-function
        warn: jest.fn(),
        // eslint-disable-next-line no-empty-function
        error: jest.fn(),
      };
      const evaluator = makeArbitrageEvaluator([]);

      const adapter = new TransformAdapter(evaluator, logger);
      adapter.transform('Settlers', [], [], [], new Map<string, PoeNinjaItemMeta>());

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Settlers'));
    });
  });
});
