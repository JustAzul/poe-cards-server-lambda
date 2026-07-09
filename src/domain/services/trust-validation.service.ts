import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { TrustValidation } from '@domain/value-objects/trust-validation';

/**
 * Trust thresholds applied when validating a card→reward pair.
 * `minTrustCount` gates count-priced rewards (uniques/gems/currency);
 * `volumeFloor` gates volume-priced div cards (card side and div-chain reward side).
 */
export interface TrustThresholds {
  minTrustCount: number;
  volumeFloor: number;
}

/**
 * Trust Validation Service - Domain Service
 * Encapsulates business rules for price data reliability validation.
 *
 * Div cards are priced via the poe.ninja exchange endpoint, which carries a
 * traded-volume signal instead of a listing count — so the card being bought and
 * any div-card reward in a card→card chain are gated on a volume floor. Non-div
 * rewards (unique/gem/currency) keep the listing-count gate.
 */
export class TrustValidationService {
  validateCardRewardTrust(
    cardPrice: ItemOverview,
    rewardPrice: ItemOverview | CurrencyItem,
    thresholds: TrustThresholds,
  ): TrustValidation {
    // Card side — div card gated on traded volume (no listing count post-migration)
    if (cardPrice.getVolume() < thresholds.volumeFloor) {
      return TrustValidation.invalid('Card volume below minimum trust floor');
    }

    if (rewardPrice instanceof CurrencyItem) {
      return TrustValidationService.validateCurrencyReward(rewardPrice, thresholds.minTrustCount);
    }

    // Div-card reward (card→card chain) — gated on volume, not count
    if (rewardPrice.itemClass === ItemClass.DIVINATION_CARD) {
      if (rewardPrice.getVolume() < thresholds.volumeFloor) {
        return TrustValidation.invalid('Div-chain reward volume below minimum trust floor');
      }
      return TrustValidation.valid();
    }

    // Unique/gem item reward — listing count
    if (rewardPrice.getCount() < thresholds.minTrustCount) {
      return TrustValidation.invalid('Reward price count below minimum trust threshold');
    }

    return TrustValidation.valid();
  }

  private static validateCurrencyReward(
    rewardPrice: CurrencyItem,
    minTrustCount: number,
  ): TrustValidation {
    // Chaos Orb is always trusted (baseline currency)
    if (rewardPrice.isChaosOrb()) {
      return TrustValidation.valid();
    }

    if (rewardPrice.getReceiveCount() < minTrustCount) {
      return TrustValidation.invalid('Currency receive count below minimum trust threshold');
    }

    return TrustValidation.valid();
  }
}
