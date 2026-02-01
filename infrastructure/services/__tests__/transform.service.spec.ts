import { IArbitrageEvaluator } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';
import { ItemCard } from '@domain/entities/item-card.entity';
import { Arbitrage } from '@domain/models/arbitrage';
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

  describe('transformLeague', () => {
    it('should pass separated items and currency as LeagueData', () => {
      const items: ItemOverview[] = [
        {
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
        },
      ];

      const currencyItems: CurrencyItem[] = [
        {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
        },
      ];

      const cards: Card[] = [];

      const mockFlipTable: Arbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockFlipTable);

      service.transform('Standard', items, currencyItems, cards);

      expect(mockArbitrageEvaluator.findAllArbitrageOpportunities).toHaveBeenCalledWith(
        { items, currency: currencyItems },
        cards,
      );
    });

    it('should pass cards parameter to arbitrage evaluator', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [
        new ItemCard('The Doctor', 'Headhunter', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        }),
      ];

      const mockDomainResults: Arbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockDomainResults);

      service.transform('Standard', items, currencyItems, cards);

      expect(mockArbitrageEvaluator.findAllArbitrageOpportunities).toHaveBeenCalledWith(
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
        {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        },
        {
          currencyTypeName: 'Divine Orb',
          chaosEquivalent: 200,
        },
      ];
      const cards: Card[] = [];

      const mockDomainResults: Arbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockDomainResults);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.currency).toHaveLength(2);
      expect(result.currency[0]).toEqual({
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      });
      expect(result.currency[1]).toEqual({
        currencyTypeName: 'Divine Orb',
        chaosEquivalent: 200,
      });
    });

    it('should return profit table from arbitrage evaluator', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [];

      const mockDomainResults: Arbitrage[] = [
        {
          cardName: 'The Doctor',
          cardStack: 8,
          cardChaosPrice: 500,
          cardArtFilename: '',
          cardFlavourText: '',
          rewardName: 'Headhunter',
          rewardChaosPrice: 5000,
          rewardClass: 2,
          isCorrupted: false,
          setChaosPrice: 4000,
          chaosProfit: 1000,
          isCurrency: false,
        },
      ];

      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockDomainResults);

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
        {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        },
      ];
      const cards: Card[] = [];

      const mockDomainResults: Arbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockDomainResults);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result).toHaveProperty('profitTable');
      expect(result).toHaveProperty('currency');
      expect(Array.isArray(result.profitTable)).toBe(true);
      expect(Array.isArray(result.currency)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [];

      const mockDomainResults: Arbitrage[] = [];
      mockArbitrageEvaluator.findAllArbitrageOpportunities.mockReturnValue(mockDomainResults);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.profitTable).toEqual([]);
      expect(result.currency).toEqual([]);
    });
  });
});
