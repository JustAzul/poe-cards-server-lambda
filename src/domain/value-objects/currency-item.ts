/**
 * Currency Item - Immutable market pricing data for currency
 * Value object representing currency market information from pricing APIs
 */
export class CurrencyItem {
  static readonly BASELINE_CURRENCY = 'Chaos Orb';

  readonly currencyTypeName: string;

  readonly chaosEquivalent: number;

  /** Traded volume signal from the poe.ninja exchange endpoint (replaces listing count) */
  readonly volumePrimaryValue?: number;

  constructor(data: {
    currencyTypeName: string;
    chaosEquivalent: number;
    volumePrimaryValue?: number;
  }) {
    if (!data.currencyTypeName || typeof data.currencyTypeName !== 'string') {
      throw new Error('CurrencyItem: currencyTypeName must be a non-empty string');
    }
    if (!Number.isFinite(data.chaosEquivalent)) {
      throw new Error('CurrencyItem: chaosEquivalent must be a finite number');
    }
    this.currencyTypeName = data.currencyTypeName;
    this.chaosEquivalent = data.chaosEquivalent;
    this.volumePrimaryValue = data.volumePrimaryValue;
  }

  /**
   * Check if this is Chaos Orb (baseline currency)
   */
  isChaosOrb(): boolean {
    return this.currencyTypeName === CurrencyItem.BASELINE_CURRENCY;
  }

  /**
   * Get traded volume for currency-reward trust validation
   * Returns 0 when volume is undefined — treats missing data as no liquidity
   */
  getVolume(): number {
    return this.volumePrimaryValue ?? 0;
  }
}
