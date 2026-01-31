import { TransformService } from '../transform.service';
import { IProfitCalculationService } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';

describe('TransformService', () => {
  let service: TransformService;
  let mockProfitService: jest.Mocked<IProfitCalculationService>;

  beforeEach(() => {
    mockProfitService = {
      calculateCardProfit: jest.fn(),
      buildFlipTable: jest.fn(),
    };
    service = new TransformService(mockProfitService);
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

      const mockFlipTable: FlipTableRowDto[] = [];
      mockProfitService.buildFlipTable.mockReturnValue(mockFlipTable);

      service.transform('Standard', items, currencyItems, cards);

      expect(mockProfitService.buildFlipTable).toHaveBeenCalledWith(
        { items, currency: currencyItems },
        cards,
      );
    });

    it('should pass cards parameter to profit service', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [
        {
          type: 'item',
          name: 'The Doctor',
          reward: 'Headhunter',
          rewardSpec: {
            iClass: 2,
            corrupted: false,
            links: 0,
            gemLevel: 0,
          },
        },
      ];

      mockProfitService.buildFlipTable.mockReturnValue([]);

      service.transform('Standard', items, currencyItems, cards);

      expect(mockProfitService.buildFlipTable).toHaveBeenCalledWith(
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

      mockProfitService.buildFlipTable.mockReturnValue([]);

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

    it('should return flip table from profit service', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [];

      const mockFlipTable: FlipTableRowDto[] = [
        {
          card: {
            name: 'The Doctor',
            stack: 8,
            chaosPrice: 500,
            details: {
              artFilename: '',
              cardName: 'The Doctor',
              cardStack: 8,
              rewardName: 'Headhunter',
              rewardClass: 2,
              isCorrupted: false,
              flavour: '',
            },
          },
          reward: {
            name: 'Headhunter',
            chaosPrice: 5000,
          },
          setChaosPrice: 4000,
          chaosProfit: 1000,
          isCurrency: false,
        },
      ];

      mockProfitService.buildFlipTable.mockReturnValue(mockFlipTable);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.flipTable).toEqual(mockFlipTable);
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

      mockProfitService.buildFlipTable.mockReturnValue([]);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result).toHaveProperty('flipTable');
      expect(result).toHaveProperty('currency');
      expect(Array.isArray(result.flipTable)).toBe(true);
      expect(Array.isArray(result.currency)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const items: ItemOverview[] = [];
      const currencyItems: CurrencyItem[] = [];
      const cards: Card[] = [];

      mockProfitService.buildFlipTable.mockReturnValue([]);

      const result = service.transform('Standard', items, currencyItems, cards);

      expect(result.flipTable).toEqual([]);
      expect(result.currency).toEqual([]);
    });
  });
});
