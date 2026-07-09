import { TrustValidationService } from '@domain/services/trust-validation.service';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';

function makeCardPrice(volumePrimaryValue?: number): ItemOverview {
  return new ItemOverview({
    name: 'The Doctor',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 1000,
    volumePrimaryValue,
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

function makeDivCardReward(volumePrimaryValue?: number): ItemOverview {
  return new ItemOverview({
    name: 'The Nurse',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 200,
    volumePrimaryValue,
  });
}

function makeCurrency(name: string, receiveCount?: number): CurrencyItem {
  return new CurrencyItem({
    currencyTypeName: name,
    chaosEquivalent: 100,
    receive: receiveCount !== undefined ? { count: receiveCount } : undefined,
  });
}

const MIN_TRUST = 10;
const NO_VOLUME_FLOOR = 0;
const POSITIVE_FLOOR = 5;

describe('TrustValidationService', () => {
  let service: TrustValidationService;

  beforeEach(() => {
    service = new TrustValidationService();
  });

  describe('card-side trust (volume floor)', () => {
    it('should accept any card when the floor is 0 (default: no volume filtering)', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(0),
        makeItemReward(20),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject a card below a positive volume floor', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(2),
        makeItemReward(20),
        { minTrustCount: MIN_TRUST, volumeFloor: POSITIVE_FLOOR },
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('volume');
    });

    it('should accept a card exactly at a positive volume floor', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(5),
        makeItemReward(20),
        { minTrustCount: MIN_TRUST, volumeFloor: POSITIVE_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('item reward trust (listing count, unchanged)', () => {
    it('should be valid when item reward count meets threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeItemReward(20),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });

    it('should be invalid when item reward count is below threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeItemReward(3),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Reward price count');
    });
  });

  describe('div-chain reward trust (volume floor) — FR10 regression guard', () => {
    it('should produce a card→card reward with floor 0 even when it has no count/volume', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeDivCardReward(0),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject a div-chain reward below a positive volume floor', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeDivCardReward(2),
        { minTrustCount: MIN_TRUST, volumeFloor: POSITIVE_FLOOR },
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('volume');
    });

    it('should accept a div-chain reward at/above a positive volume floor', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeDivCardReward(5),
        { minTrustCount: MIN_TRUST, volumeFloor: POSITIVE_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('currency reward trust (receive count, unchanged)', () => {
    it('should be valid when currency receive count meets threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeCurrency('Exalted Orb', 15),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });

    it('should be invalid when currency receive count is below threshold', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeCurrency('Exalted Orb', 2),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Currency receive count');
    });

    it('should always trust Chaos Orb regardless of count', () => {
      const result = service.validateCardRewardTrust(
        makeCardPrice(50),
        makeCurrency('Chaos Orb', 0),
        { minTrustCount: MIN_TRUST, volumeFloor: NO_VOLUME_FLOOR },
      );

      expect(result.isValid).toBe(true);
    });
  });
});
