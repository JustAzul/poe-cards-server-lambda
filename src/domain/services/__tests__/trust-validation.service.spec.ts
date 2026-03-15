import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';

function makeCardPrice(count?: number): ItemOverview {
  return new ItemOverview({
    name: 'The Doctor',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 1000,
    count,
  });
}

function makeItemReward(count?: number): ItemOverview {
  return new ItemOverview({
    name: 'Headhunter',
    itemClass: ItemClass.UNIQUE,
    chaosValue: 8000,
    count,
  });
}

function makeCurrency(name: string, receiveCount?: number): CurrencyItem {
  return new CurrencyItem({
    currencyTypeName: name,
    chaosEquivalent: 100,
    receive: receiveCount !== undefined ? { count: receiveCount } : undefined,
  });
}

describe('TrustValidationService', () => {
  let service: TrustValidationService;
  const MIN_TRUST = 10;

  beforeEach(() => {
    service = new TrustValidationService();
  });

  describe('card trust validation', () => {
    it('should be valid when card count meets trust threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeItemReward(20),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should be invalid when card count is below trust threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(5),
        makeItemReward(20),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Card price count');
    });

    it('should be valid when card count is exactly at threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(10),
        makeItemReward(20),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(true);
    });

    it('should be invalid when card count is undefined (defaults to 0)', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(undefined),
        makeItemReward(20),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Card price count');
    });
  });

  describe('item reward trust validation', () => {
    it('should be valid when item reward count meets threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeItemReward(20),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(true);
    });

    it('should be invalid when item reward count is below threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeItemReward(3),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Reward price count');
    });
  });

  describe('currency reward trust validation', () => {
    it('should be valid when currency receive count meets threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeCurrency('Exalted Orb', 15),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(true);
    });

    it('should be invalid when currency receive count is below threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeCurrency('Exalted Orb', 2),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Currency receive count');
    });

    it('should be invalid when currency has no receive field (defaults to 0)', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeCurrency('Exalted Orb'),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Currency receive count');
    });

    it('should always trust Chaos Orb regardless of count', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeCurrency('Chaos Orb', 0),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('combined validation', () => {
    it('should be invalid when card passes but reward fails', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(15),
        makeItemReward(3),
        MIN_TRUST,
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Reward price count');
    });
  });
});
