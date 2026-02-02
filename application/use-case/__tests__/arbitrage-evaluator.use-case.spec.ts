import { LeagueData, ArbitrageEvaluator } from '@application/use-case/arbitrage-evaluator.use-case';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';

describe('ArbitrageEvaluator', () => {
  let service: ArbitrageEvaluator;
  let leagueData: LeagueData;

  beforeEach(() => {
    service = new ArbitrageEvaluator();
    leagueData = { items: [], currency: [] };
  });

  describe('evaluateCardArbitrage', () => {
    describe('item cards', () => {
      it('should evaluate arbitrage for valid item card', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
          artFilename: 'doctor.png',
          flavourText: 'You are the Disease',
        });

        const rewardOverview = ItemOverview.fromRaw({
          name: 'Headhunter',
          itemClass: 2,
          chaosValue: 5000,
          count: 20,
        });

        const card = DivinationCard.fromItemCardConfig({
          Name: 'The Doctor',
          Reward: 'Headhunter',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        });

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
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Wretched',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const rewardOverview = ItemOverview.fromRaw({
          name: 'Gem Name',
          itemClass: 4,
          chaosValue: 100,
          count: 50,
          gemLevel: 20,
        });

        const card = DivinationCard.fromItemCardConfig({
          Name: 'The Wretched',
          Reward: 'Gem Name',
          Corrupted: false,
          iClass: 4,
          Links: 0,
          gemLevel: 20,
        });

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.market.rewardPrice).toEqual(rewardOverview);
      });

      it('should return null when card not found in items', () => {
        const card = DivinationCard.fromItemCardConfig({
          Name: 'Nonexistent Card',
          Reward: 'Nonexistent Item',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        });

        leagueData.items = [];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward not found', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
        });

        const card = DivinationCard.fromItemCardConfig({
          Name: 'The Doctor',
          Reward: 'Nonexistent Item',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        });

        leagueData.items = [cardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when trust validation fails due to low card count', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 5, // Below MIN_TRUST_COUNT of 10
          stackSize: 8,
        });

        const rewardOverview = ItemOverview.fromRaw({
          name: 'Headhunter',
          itemClass: 2,
          chaosValue: 5000,
          count: 20,
        });

        const card = DivinationCard.fromItemCardConfig({
          Name: 'The Doctor',
          Reward: 'Headhunter',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        });

        leagueData.items = [cardOverview, rewardOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return aggregate with negative profit (filtering at app layer)', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 5000,
          count: 50,
          stackSize: 8, // 8 * 5000 = 40000
        });

        const rewardOverview = ItemOverview.fromRaw({
          name: 'Bad Reward',
          itemClass: 2,
          chaosValue: 100, // 100 < 40000, so unprofitable
          count: 20,
        });

        const card = DivinationCard.fromItemCardConfig({
          Name: 'The Doctor',
          Reward: 'Bad Reward',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        });

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
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = CurrencyItem.fromRaw({
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        });

        const card = DivinationCard.fromCurrencyCardConfig({
          Name: 'The Hoarder',
          Reward: 'Chaos Orb',
          Amount: 1,
        });

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.card.name).toBe('The Hoarder');
        expect(result?.profit.rewardChaosValue).toBe(1);
        expect(result?.card.isCurrencyCard()).toBe(true);
      });

      it('should handle multiple currency amounts', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Gambler',
          itemClass: 6,
          chaosValue: 10,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = CurrencyItem.fromRaw({
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 300,
          receive: { count: 50 },
        });

        const card = DivinationCard.fromCurrencyCardConfig({
          Name: 'The Gambler',
          Reward: 'Exalted Orb',
          Amount: 5,
        });

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.profit.rewardChaosValue).toBe(1500); // 300 * 5
        expect(result?.profit.chaosProfitValue).toBe(1490); // 1500 - 10
      });

      it('should return null when currency not found', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const card = DivinationCard.fromCurrencyCardConfig({
          Name: 'The Hoarder',
          Reward: 'Nonexistent Currency',
          Amount: 1,
        });

        leagueData.items = [cardOverview];
        leagueData.currency = [];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when currency trust validation fails', () => {
        const cardOverview = ItemOverview.fromRaw({
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        });

        const currencyOverview = CurrencyItem.fromRaw({
          currencyTypeName: 'Expensive Currency',
          chaosEquivalent: 300,
          receive: { count: 5 }, // Below MIN_TRUST_COUNT of 10
        });

        const card = DivinationCard.fromCurrencyCardConfig({
          Name: 'The Hoarder',
          Reward: 'Expensive Currency',
          Amount: 1,
        });

        leagueData.items = [cardOverview];
        leagueData.currency = [currencyOverview];

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });
    });
  });

  describe('findAllArbitrageOpportunities', () => {
    it('should find all profitable opportunities', () => {
      // High-profit item card
      const doctorCard = DivinationCard.fromItemCardConfig({
        Name: 'The Doctor',
        Reward: 'Headhunter',
        Corrupted: false,
        iClass: 2,
        Links: 0,
        gemLevel: 0,
      });

      // Profitable currency card (need high enough reward to exceed card cost)
      const hoarderCard = DivinationCard.fromCurrencyCardConfig({
        Name: 'The Hoarder',
        Reward: 'Exalted Orb',
        Amount: 1,
      });

      // Unprofitable card
      const unprofitableCard = DivinationCard.fromItemCardConfig({
        Name: 'Bad Card',
        Reward: 'Bad Item',
        Corrupted: false,
        iClass: 5,
        Links: 0,
        gemLevel: 0,
      });

      leagueData.items = [
        ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
        }),
        ItemOverview.fromRaw({
          name: 'Headhunter',
          itemClass: 2,
          chaosValue: 5000,
          count: 20,
        }),
        ItemOverview.fromRaw({
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 25,
          count: 50,
          stackSize: 1,
        }),
        ItemOverview.fromRaw({
          name: 'Bad Card',
          itemClass: 6,
          chaosValue: 100,
          count: 50,
          stackSize: 1,
        }),
        ItemOverview.fromRaw({
          name: 'Bad Item',
          itemClass: 5,
          chaosValue: 10,
          count: 50,
        }),
      ];

      leagueData.currency = [
        CurrencyItem.fromRaw({
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 200, // 200 > 25 (card cost), so profitable
          receive: { count: 50 },
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
      const card = DivinationCard.fromItemCardConfig({
        Name: 'Unprofitable',
        Reward: 'Cheap Reward',
        Corrupted: false,
        iClass: 2,
        Links: 0,
        gemLevel: 0,
      });

      leagueData.items = [
        ItemOverview.fromRaw({
          name: 'Unprofitable',
          itemClass: 6,
          chaosValue: 1000,
          count: 50,
          stackSize: 1,
        }),
        ItemOverview.fromRaw({
          name: 'Cheap Reward',
          itemClass: 2,
          chaosValue: 10,
          count: 50,
        }),
      ];

      const results = service.findAllArbitrageOpportunities(leagueData, [card]);

      expect(results.length).toBe(0);
    });
  });
});
