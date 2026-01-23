import { IPriceConversionService } from '@application/interfaces/services.interface';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

export class PriceConversionService implements IPriceConversionService {
  /**
   * Convert chaos value to exalted value
   * @param chaosValue - Value in chaos orbs
   * @param exaltedChaosEquivalent - How many chaos orbs = 1 exalted orb
   * @returns Value in exalted orbs
   */
  convertChaosToExalted(chaosValue: number, exaltedChaosEquivalent: number): number {
    // Prevent division by zero
    if (exaltedChaosEquivalent === 0) return 0;
    return parseFloat((chaosValue / exaltedChaosEquivalent).toFixed(1));
  }

  /**
   * Get the chaos equivalent value for Exalted Orb
   * @param leagueData - Combined array of items and currency
   * @returns Chaos equivalent of 1 Exalted Orb
   */
  getExaltedValue(leagueData: Array<ItemOverview | CurrencyItem>): number {
    const exaltedOrb = leagueData.find(
      (item): item is CurrencyItem =>
        'currencyTypeName' in item && item.currencyTypeName === 'Exalted Orb'
    );
    return exaltedOrb?.chaosEquivalent || 0;
  }
}

export const priceConversionService = new PriceConversionService();
