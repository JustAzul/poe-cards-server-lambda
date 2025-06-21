import BuildEntityUseCase from '../build-entity.use-case';
import LeagueEntity from 'domain/entities/league.entity';
import ItemOverviewEntity from 'domain/entities/item-overview.entity';
import CurrencyOverviewEntity from 'domain/entities/currency-overview.entity';
import { ItemClass } from 'domain/entities/item-class.enum';

describe('BuildEntityUseCase', () => {
  describe('LeagueEntity builder', () => {
    it('should build LeagueEntity correctly', () => {
      const useCase = new BuildEntityUseCase('LeagueEntity');
      const props = {
        delveEvent: false,
        endAt: null,
        id: 'Test League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: 'https://example.com',
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(LeagueEntity);
      expect(result.name).toBe('Test League');
      expect(result.realm).toBe('pc');
    });

    it('should build LeagueEntity with complex rules and dates', () => {
      const useCase = new BuildEntityUseCase('LeagueEntity');
      const props = {
        delveEvent: true,
        endAt: '2023-12-31T23:59:59Z',
        id: 'Hardcore League',
        realm: 'pc',
        rules: [
          { id: 'Hardcore', name: 'Hardcore', description: 'Hardcore mode' },
          { id: 'NoParties', name: 'Solo Self-Found', description: 'SSF mode' }
        ],
        startAt: '2023-01-01T00:00:00Z',
        timedEvent: true,
        url: 'https://pathofexile.com/leagues',
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(LeagueEntity);
      expect(result.isHardcore()).toBe(true);
      expect(result.isSSF()).toBe(true);
      expect(result.shouldFilter()).toBe(true);
      expect(result.hasDelveEvent).toBe(true);
      expect(result.isTimedEvent).toBe(true);
      expect(result.startAt).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(result.endAt).toEqual(new Date('2023-12-31T23:59:59Z'));
    });
  });

  describe('ItemOverviewEntity builder', () => {
    it('should build ItemOverviewEntity with all properties', () => {
      const useCase = new BuildEntityUseCase('ItemOverviewEntity');
      const props = {
        name: 'The Doctor',
        chaosValue: 150.5,
        detailsId: 'the-doctor',
        stackSize: 8,
        itemClass: ItemClass.DivinationCard,
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(ItemOverviewEntity);
      expect(result.name).toBe('The Doctor');
      expect(result.chaosValue).toBe(150.5);
      expect(result.detailsId).toBe('the-doctor');
      expect(result.stackSize).toBe(8);
      expect(result.itemClass).toBe(ItemClass.DivinationCard);
    });

    it('should build ItemOverviewEntity with minimal properties', () => {
      const useCase = new BuildEntityUseCase('ItemOverviewEntity');
      const props = {
        name: 'Simple Item',
        chaosValue: 1,
        detailsId: 'simple-item',
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(ItemOverviewEntity);
      expect(result.name).toBe('Simple Item');
      expect(result.chaosValue).toBe(1);
      expect(result.detailsId).toBe('simple-item');
      expect(result.stackSize).toBeUndefined();
      expect(result.itemClass).toBeUndefined();
    });
  });

  describe('CurrencyOverviewEntity builder', () => {
    it('should build CurrencyOverviewEntity correctly', () => {
      const useCase = new BuildEntityUseCase('CurrencyOverviewEntity');
      const props = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
        detailsId: 'chaos-orb',
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(CurrencyOverviewEntity);
      expect(result.name).toBe('Chaos Orb');
      expect(result.chaosValue).toBe(1);
      expect(result.detailsId).toBe('chaos-orb');
    });

    it('should build CurrencyOverviewEntity with high value currency', () => {
      const useCase = new BuildEntityUseCase('CurrencyOverviewEntity');
      const props = {
        currencyTypeName: 'Divine Orb',
        chaosEquivalent: 200.75,
        detailsId: 'divine-orb',
      };

      const result = useCase.execute(props);

      expect(result).toBeInstanceOf(CurrencyOverviewEntity);
      expect(result.name).toBe('Divine Orb');
      expect(result.chaosValue).toBe(200.75);
      expect(result.detailsId).toBe('divine-orb');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported entity type', () => {
      expect(() => {
        // @ts-expect-error Testing invalid entity type
        new BuildEntityUseCase('UnsupportedEntity');
      }).toThrow('Entity UnsupportedEntity is not supported.');
    });

    it('should throw error for null entity type', () => {
      expect(() => {
        // @ts-expect-error Testing null entity type
        new BuildEntityUseCase(null);
      }).toThrow('Entity null is not supported.');
    });

    it('should throw error for undefined entity type', () => {
      expect(() => {
        // @ts-expect-error Testing undefined entity type  
        new BuildEntityUseCase(undefined);
      }).toThrow('Entity undefined is not supported.');
    });
  });

  describe('Type safety and edge cases', () => {
    it('should handle LeagueEntity with empty rules array', () => {
      const useCase = new BuildEntityUseCase('LeagueEntity');
      const props = {
        delveEvent: false,
        endAt: null,
        id: 'Standard',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      };

      const result = useCase.execute(props);

      expect(result.isHardcore()).toBe(false);
      expect(result.isSSF()).toBe(false);
      expect(result.isRuthless()).toBe(false);
      expect(result.shouldFilter()).toBe(true); // Standard league should be filtered
    });

    it('should handle ItemOverviewEntity with zero chaos value', () => {
      const useCase = new BuildEntityUseCase('ItemOverviewEntity');
      const props = {
        name: 'Worthless Item',
        chaosValue: 0,
        detailsId: 'worthless',
      };

      const result = useCase.execute(props);

      expect(result.chaosValue).toBe(0);
      expect(result.name).toBe('Worthless Item');
    });

    it('should handle CurrencyOverviewEntity with fractional chaos value', () => {
      const useCase = new BuildEntityUseCase('CurrencyOverviewEntity');
      const props = {
        currencyTypeName: 'Chromatic Orb',
        chaosEquivalent: 0.125,
        detailsId: 'chromatic-orb',
      };

      const result = useCase.execute(props);

      expect(result.chaosValue).toBe(0.125);
    });
  });
}); 