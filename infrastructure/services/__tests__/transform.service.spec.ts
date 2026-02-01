import { IArbitrageEvaluator } from '@application/services/arbitrage-evaluator.service';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { DivinationCard } from '@domain/entities/card.entity';
import { CardArbitrage } from '@domain/aggregates/card-arbitrage.aggregate';
import { MarketSnapshot } from '@domain/value-objects/market-snapshot';
import { ProfitResult } from '@domain/value-objects/profit-result';
import { TrustValidation } from '@domain/value-objects/trust-validation';
import { TransformService } from '../transform.service';

describe('TransformService', () => {
  let service: TransformService;
  let mockArbitrageEvaluator: jest.Mocked<IArbitrageEvaluator>;

  beforeEach(() => {
    mockArbitrageEvaluator = {
      evaluateCardArbitrage: jest.fn(),
      findAllArbitrageOpportunities: jest.fn(),
    };
    service = new TransformService(mockArbitrageEvaluator);
  });

  describe('transform', () => {
    it('should pass separated items and currency as LeagueData', () => {
      const items: ItemOverview[] = [
        ItemOverview.fromRaw({
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
        }),
      ];

      const currencyItems: CurrencyItem[] = [
        CurrencyItem.fromRaw({
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
        }),
      ];

      const cards: DivinationCard[] = [];

      const mockResults: CardArbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(
        mockResults,
      );

      service.transform('Standard', items, currencyItems, cards);

      expect(
        mockArbitrageEvaluator.findAllArbitrageOpportunities,
      ).toHaveBeenCalledWith({ items, currency: currencyItems }, cards);
    });

    it('should pass cards parameter to arbitrage evaluator', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: DivinationCard[] = [
        DivinationCard.fromItemCardConfig({
          Name: 'The Doctor',
          Reward: 'Headhunter',
          Corrupted: false,
          iClass: 2,
          Links: 0,
          gemLevel: 0,
        }),
      ];

      const mockResults: CardArbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(
        mockResults,
      );

      service.transform('Standard', items, currencyItems, cards);

      expect(
        mockArbitrageEvaluator.findAllArbitrageOpportunities,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.any(Array),
          currency: expect.any(Array),
        }),
        cards,
      );
    });

    it('should return currency items without transformation', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [
        CurrencyItem.fromRaw({
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        }),
        CurrencyItem.fromRaw({
          currencyTypeName: 'Divine Orb',
          chaosEquivalent: 200,
        }),
      ];
      const cards: DivinationCard[] = [];

      const mockResults: CardArbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(
        mockResults,
      );

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.currency).toHaveLength(2);
      expect(result.currency[0]).toBe(currencyItems[0]);
      expect(result.currency[1]).toBe(currencyItems[1]);
    });

    it('should return profit table from arbitrage evaluator', () => {
      const cardPrice = ItemOverview.fromRaw({
        name: 'The Doctor',
        itemClass: 6,
        chaosValue: 500,
        count: 50,
        stackSize: 8,
        artFilename: 'doctor.png',
        flavourText: 'You are the Disease',
      });

      const rewardPrice = ItemOverview.fromRaw({
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 20,
      });

      const items: ItemOverview[] = [cardPrice, rewardPrice];
      const currencyItems: CurrencyItem[] = [];
      const cards: DivinationCard[] = [];

      const card = DivinationCard.fromItemCardConfig({
        Name: 'The Doctor',
        Reward: 'Headhunter',
        Corrupted: false,
        iClass: 2,
        Links: 0,
        gemLevel: 0,
      });

      const mockResult = CardArbitrage.create(
        card,
        MarketSnapshot.create(cardPrice, rewardPrice, 'test'),
        ProfitResult.create(1000, 4000, 5000, 25),
        TrustValidation.valid(),
      );

      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue([
        mockResult,
      ]);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.profitTable).toHaveLength(1);
      expect(result.profitTable[0].card.name).toBe('The Doctor');
      expect(result.profitTable[0].card.stack).toBe(8);
      expect(result.profitTable[0].card.chaosPrice).toBe(500);
      expect(result.profitTable[0].reward.name).toBe('Headhunter');
      expect(result.profitTable[0].reward.chaosPrice).toBe(5000);
      expect(result.profitTable[0].setChaosPrice).toBe(4000);
      expect(result.profitTable[0].chaosProfit).toBe(1000);
      expect(result.profitTable[0].isCurrency).toBe(false);
    });

    it('should return correct structure', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [
        CurrencyItem.fromRaw({
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        }),
      ];
      const cards: DivinationCard[] = [];

      const mockResults: CardArbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(
        mockResults,
      );

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result).toHaveProperty('profitTable');
      expect(result).toHaveProperty('currency');
      expect(Array.isArray(result.profitTable)).toBe(true);
      expect(Array.isArray(result.currency)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: DivinationCard[] = [];

      const mockResults: CardArbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(
        mockResults,
      );

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.profitTable).toEqual([]);
      expect(result.currency).toEqual([]);
    });
  });
});
