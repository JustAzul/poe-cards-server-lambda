import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { TrustValidation } from '@domain/value-objects/trust-validation';

/**
 * Trust Validation Service - Domain Service
 * Encapsulates business rules for price data reliability validation
 * Validates trust thresholds for card and reward prices
 */
export class TrustValidationService {
  /**
   * Validate trust for card and reward prices
   * Ensures minimum count thresholds are met for reliable pricing data
   */
  validateCardRewardTrust(
    cardPrice: ItemOverview,
    rewardPrice: ItemOverview | CurrencyItem,
    minTrustCount: number,
  ): TrustValidation {
    const cardCount = cardPrice.getCount();

    // Card must meet minimum count threshold
    if (cardCount < minTrustCount) {
      return TrustValidation.invalid(
        'Card price count below minimum trust threshold',
      );
    }

    // Currency-specific validation
    if (rewardPrice instanceof CurrencyItem) {
      // Chaos Orb is always trusted (baseline currency)
      if (rewardPrice.isChaosOrb()) {
        return TrustValidation.valid();
      }

      // Other currency must meet minimum receive count
      const receiveCount = rewardPrice.getReceiveCount();
      if (receiveCount < minTrustCount) {
        return TrustValidation.invalid(
          'Currency receive count below minimum trust threshold',
        );
      }

      return TrustValidation.valid();
    }

    // Item-specific validation
    const rewardCount = rewardPrice.getCount();
    if (rewardCount < minTrustCount) {
      return TrustValidation.invalid(
        'Reward price count below minimum trust threshold',
      );
    }

    return TrustValidation.valid();
  }
}
