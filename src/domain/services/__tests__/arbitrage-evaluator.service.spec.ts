import { ArbitrageEvaluatorService } from '@domain/services/arbitrage-evaluator.service';
import { LeagueData } from '@domain/ports/arbitrage-evaluator.port';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { createItemRewardSpec, createCurrencyRewardSpec } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { RewardMatcherService } from '@domain/services/reward-matcher.service';
import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { TrustValidationService } from '@domain/services/trust-validation.service';

describe('ArbitrageEvaluatorService', () => {
  let service: ArbitrageEvaluatorService;
  let leagueData: LeagueData;

  beforeEach(() => {
    // eslint-disable-next-line no-empty-function
    const silentLogger = { warn: () => {}, log: () => {}, error: () => {} };
    const rewardMatcher = new RewardMatcherService(silentLogger);
    const calculator = new ArbitrageCalculationService();
    const trustValidator = new TrustValidationService();
    // eslint-disable-next-line max-len
    service = new ArbitrageEvaluatorService(rewardMatcher, calculator, trustValidator, silentLogger);
    leagueData = { league: 'Standard', items: [], currency: [] };
  });

  describe('evaluateCardArbitrage', () => {
    describe('item cards', () => {
      it('should evaluate arbitrage for valid item card', () => {
        const cardOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
        });

        const rewardOverview = new ItemOverview({
          name: 'Headhunter',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 5000,
          count: 20,
        });

        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.card.name).toBe('The Doctor');
        expect(result?.market.cardPrice.stackSize).toBe(8);
        expect(result?.market.cardPrice.chaosValue).toBe(500);
        expect(result?.profit.rewardChaosValue).toBe(5000);
        expect(result?.profit.setChaosPrice).toBe(4000); // 8 * 500
        expect(result?.profit.chaosProfitValue).toBe(1000); // 5000 - 4000
        expect(result?.card.isCurrencyCard()).toBe(false);
      });

      it('should format gem rewards with level', () => {
        const cardOverview = new ItemOverview({
          name: 'The Wretched',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const rewardOverview = new ItemOverview({
          name: 'Gem Name',
          itemClass: ItemClass.SKILL_GEM,
          chaosValue: 100,
          count: 50,
          gemLevel: 20,
        });

        const card = new DivinationCard(
          'The Wretched',
          'Gem Name',
          createItemRewardSpec(ItemClass.SKILL_GEM, false, 20),
        );

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.market.rewardPrice).toEqual(rewardOverview);
      });

      it('should return null when card not found in items', () => {
        const card = new DivinationCard(
          'Nonexistent Card',
          'Nonexistent Item',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        leagueData.items = [];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward not found', () => {
        const cardOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
        });

        const card = new DivinationCard(
          'The Doctor',
          'Nonexistent Item',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        leagueData.items = [cardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should accept a card with zero traded volume (volume floor default 0 = max coverage)', () => {
        const cardOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 500,
          volumePrimaryValue: 0, // no liquidity, but floor is 0 so it still passes
          stackSize: 8,
        });

        const rewardOverview = new ItemOverview({
          name: 'Headhunter',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 5000,
          count: 20,
        });

        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).not.toBeNull();
      });

      it('should produce a card→card chain reward via the volume floor (no listing count)', () => {
        // The Nurse → The Doctor: div-card reward has no listing count post-migration.
        // With the default floor 0, the chain still produces a row (FR10 regression guard).
        const nurseCard = new DivinationCard(
          'The Nurse',
          'The Doctor',
          createItemRewardSpec(ItemClass.DIVINATION_CARD, false, 0),
        );

        const nurseOverview = new ItemOverview({
          name: 'The Nurse',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 100,
          volumePrimaryValue: 0,
          stackSize: 9,
        });

        const doctorOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 5000,
          volumePrimaryValue: 0,
          stackSize: 8,
        });

        leagueData.items = [nurseOverview, doctorOverview];

        const result = service.evaluateCardArbitrage(leagueData, nurseCard);

        expect(result).not.toBeNull();
        expect(result?.card.name).toBe('The Nurse');
      });

      it('should still skip a non-div-card reward whose listing count is below the threshold', () => {
        // Unique reward with count=7 (< MIN_TRUST_COUNT=10) is rejected on the reward
        // side; the count gate for non-div rewards is unchanged by the migration.
        const card = new DivinationCard(
          'The Doctor',
          'Headhunter',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        const cardOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 500,
          volumePrimaryValue: 50, // card side passes the volume floor
          stackSize: 8,
        });

        const rewardOverview = new ItemOverview({
          name: 'Headhunter',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 5000,
          count: 7, // Below MIN_TRUST_COUNT=10
        });

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return aggregate with negative profit (filtering at app layer)', () => {
        const cardOverview = new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 5000,
          count: 50,
          stackSize: 8, // 8 * 5000 = 40000
        });

        const rewardOverview = new ItemOverview({
          name: 'Bad Reward',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 100, // 100 < 40000, so unprofitable
          count: 20,
        });

        const card = new DivinationCard(
          'The Doctor',
          'Bad Reward',
          createItemRewardSpec(ItemClass.UNIQUE, false, 0),
        );

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        // Domain evaluator returns aggregate if prices/trust valid, even if unprofitable
        // Filtering by profitability happens in findAllArbitrageOpportunities
        expect(result).toBeDefined();
        expect(result?.profit.chaosProfitValue).toBeLessThan(0);
      });
    });

    describe('currency cards', () => {
      it('should evaluate arbitrage for valid currency card', () => {
        const cardOverview = new ItemOverview({
          name: 'The Hoarder',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = new CurrencyItem({
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        });

        const card = new DivinationCard(
          'The Hoarder',
          'Chaos Orb',
          createCurrencyRewardSpec(1),
        );

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.card.name).toBe('The Hoarder');
        expect(result?.profit.rewardChaosValue).toBe(1);
        expect(result?.card.isCurrencyCard()).toBe(true);
      });

      it('should handle multiple currency amounts', () => {
        const cardOverview = new ItemOverview({
          name: 'The Gambler',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 10,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = new CurrencyItem({
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 300,
          volumePrimaryValue: 50,
        });

        const card = new DivinationCard(
          'The Gambler',
          'Exalted Orb',
          createCurrencyRewardSpec(5),
        );

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.profit.rewardChaosValue).toBe(1500); // 300 * 5
        expect(result?.profit.chaosProfitValue).toBe(1490); // 1500 - 10
      });

      it('should return null when currency not found', () => {
        const cardOverview = new ItemOverview({
          name: 'The Hoarder',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const card = new DivinationCard(
          'The Hoarder',
          'Nonexistent Currency',
          createCurrencyRewardSpec(1),
        );

        leagueData.items = [cardOverview];
        leagueData.currency = [];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should include a low-volume currency reward now that the floor defaults to 0', () => {
        // Currency trust moved from listing count to the volume floor (default 0),
        // so a low-volume currency reward is no longer filtered at the evaluator.
        // The floor mechanism itself is proven in trust-validation.service.spec.
        const cardOverview = new ItemOverview({
          name: 'The Hoarder',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = new CurrencyItem({
          currencyTypeName: 'Expensive Currency',
          chaosEquivalent: 300,
          volumePrimaryValue: 0,
        });

        const card = new DivinationCard(
          'The Hoarder',
          'Expensive Currency',
          createCurrencyRewardSpec(1),
        );

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
      });
    });
  });

  describe('findAllArbitrageOpportunities', () => {
    it('should find all profitable opportunities', () => {
      // High-profit item card
      const doctorCard = new DivinationCard(
        'The Doctor',
        'Headhunter',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0),
      );

      // Profitable currency card (need high enough reward to exceed card cost)
      const hoarderCard = new DivinationCard(
        'The Hoarder',
        'Exalted Orb',
        createCurrencyRewardSpec(1),
      );

      // Unprofitable card
      const unprofitableCard = new DivinationCard(
        'Bad Card',
        'Bad Item',
        createItemRewardSpec(ItemClass.SKILL_GEM, false, 0),
      );

      leagueData.items = [
        new ItemOverview({
          name: 'The Doctor',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
        }),
        new ItemOverview({
          name: 'Headhunter',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 5000,
          count: 20,
        }),
        new ItemOverview({
          name: 'The Hoarder',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 25,
          count: 50,
          stackSize: 1,
        }),
        new ItemOverview({
          name: 'Bad Card',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 100,
          count: 50,
          stackSize: 1,
        }),
        new ItemOverview({
          name: 'Bad Item',
          itemClass: ItemClass.SKILL_GEM,
          chaosValue: 10,
          count: 50,
        }),
      ];

      leagueData.currency = [
        new CurrencyItem({
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 200, // 200 > 25 (card cost), so profitable
          volumePrimaryValue: 50,
        }),
      ];

      const cards = [doctorCard, hoarderCard, unprofitableCard];
      const results = service.findAllArbitrageOpportunities(leagueData, cards);

      expect(results.length).toBe(2);
      expect(results.some((r) => r.card.name === 'The Doctor')).toBe(true);
      expect(results.some((r) => r.card.name === 'The Hoarder')).toBe(true);
      expect(results.some((r) => r.card.name === 'Bad Card')).toBe(false);
    });

    it('should return empty array when no profitable opportunities exist', () => {
      const card = new DivinationCard(
        'Unprofitable',
        'Cheap Reward',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0),
      );

      leagueData.items = [
        new ItemOverview({
          name: 'Unprofitable',
          itemClass: ItemClass.DIVINATION_CARD,
          chaosValue: 1000,
          count: 50,
          stackSize: 1,
        }),
        new ItemOverview({
          name: 'Cheap Reward',
          itemClass: ItemClass.UNIQUE,
          chaosValue: 10,
          count: 50,
        }),
      ];

      const results = service.findAllArbitrageOpportunities(leagueData, [card]);

      expect(results.length).toBe(0);
    });
  });
});
