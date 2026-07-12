import { ArbitrageCalculationService } from '@domain/services/arbitrage-calculation.service';
import { DivinationCard } from '@domain/entities/card.entity';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import {
  createCurrencyRewardSpec,
  createItemRewardSpec,
} from '@domain/value-objects/reward-spec';

function makeCardPrice(chaosValue: number, stackSize?: number): ItemOverview {
  return new ItemOverview({
    name: 'Test Card',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue,
    stackSize,
  });
}

function makeItemReward(chaosValue: number): ItemOverview {
  return new ItemOverview({
    name: 'Test Reward',
    itemClass: ItemClass.UNIQUE,
    chaosValue,
  });
}

function makeCurrencyReward(chaosEquivalent: number): CurrencyItem {
  return new CurrencyItem({
    currencyTypeName: 'Exalted Orb',
    chaosEquivalent,
  });
}

function makeItemCard(name = 'Test Card', reward = 'Test Reward'): DivinationCard {
  return new DivinationCard(
    name,
    reward,
    createItemRewardSpec(ItemClass.UNIQUE, false, 0),
  );
}

function makeCurrencyCard(amount: number, name = 'Test Card', reward = 'Test Reward'): DivinationCard {
  return new DivinationCard(name, reward, createCurrencyRewardSpec(amount));
}

describe('ArbitrageCalculationService', () => {
  let service: ArbitrageCalculationService;

  beforeEach(() => {
    service = new ArbitrageCalculationService();
  });

  describe('calculateProfit', () => {
    it('should calculate basic profit correctly', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(2, 5),
        rewardPrice: makeItemReward(80),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.setChaosPrice).toBe(10);
      expect(result!.rewardChaosValue).toBe(80);
      expect(result!.chaosProfitValue).toBe(70);
      expect(result!.isViable()).toBe(true);
    });

    it('should return negative profit when reward is cheaper than set cost', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(10, 5),
        rewardPrice: makeItemReward(20),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.chaosProfitValue).toBe(-30);
      expect(result!.isViable()).toBe(false);
    });

    it('should return zero profit when cost equals reward', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(5, 4),
        rewardPrice: makeItemReward(20),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.chaosProfitValue).toBe(0);
      expect(result!.isViable()).toBe(false);
    });

    it('should handle fractional values without flooring', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(2.5, 4),
        rewardPrice: makeItemReward(15.7),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.setChaosPrice).toBe(10);
      expect(result!.rewardChaosValue).toBe(15.7);
      expect(result!.chaosProfitValue).toBeCloseTo(5.7);
    });

    it('should return null when stackSize is undefined', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(2),
        rewardPrice: makeItemReward(80),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).toBeNull();
    });

    it('should handle stackSize of 1', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(10, 1),
        rewardPrice: makeItemReward(80),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.setChaosPrice).toBe(10);
      expect(result!.chaosProfitValue).toBe(70);
    });

    it('should handle large stackSize', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(3, 15),
        rewardPrice: makeItemReward(100),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.setChaosPrice).toBe(45);
      expect(result!.chaosProfitValue).toBe(55);
    });

    it('should calculate ROI correctly', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(10, 5),
        rewardPrice: makeItemReward(100),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      // profit=50, setCost=50 → ROI = (50/50)*100 = 100
      expect(result!.roi).toBe(100);
    });

    it('should return ROI of 0 when setCost is 0', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(0, 5),
        rewardPrice: makeItemReward(80),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.setChaosPrice).toBe(0);
      expect(result!.roi).toBe(0);
    });
  });

  describe('calculateRewardValue (via calculateProfit)', () => {
    it('should multiply chaosEquivalent by amount for currency rewards', () => {
      const card = makeCurrencyCard(10);
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(1, 5),
        rewardPrice: makeCurrencyReward(50),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      // rewardValue = 50 * 10 = 500
      expect(result!.rewardChaosValue).toBe(500);
    });

    it('should use chaosEquivalent directly when currency amount is 1', () => {
      const card = makeCurrencyCard(1);
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(1, 3),
        rewardPrice: makeCurrencyReward(200),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.rewardChaosValue).toBe(200);
    });

    it('should use chaosValue directly for item rewards', () => {
      const card = makeItemCard();
      const market = new MarketSnapshot({
        cardPrice: makeCardPrice(1, 5),
        rewardPrice: makeItemReward(150),
        leagueId: 'Standard',
      });

      const result = service.calculateProfit(card, market);

      expect(result).not.toBeNull();
      expect(result!.rewardChaosValue).toBe(150);
    });
  });
});
