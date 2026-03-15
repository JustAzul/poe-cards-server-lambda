/**
 * Currency Item - Immutable market pricing data for currency
 * Value object representing currency market information from pricing APIs
 */
export class CurrencyItem {
  readonly currencyTypeName: string;

  readonly chaosEquivalent: number;

  readonly receive?: {
    count: number;
  };

  constructor(data: {
    currencyTypeName: string;
    chaosEquivalent: number;
    receive?: {
      count: number;
    };
  }) {
    this.currencyTypeName = data.currencyTypeName;
    this.chaosEquivalent = data.chaosEquivalent;
    this.receive = data.receive;
  }

  /**
   * Check if this is Chaos Orb (baseline currency)
   */
  isChaosOrb(): boolean {
    return this.currencyTypeName === 'Chaos Orb';
  }

  /**
   * Get receive count for trust validation (defaults to 0)
   */
  getReceiveCount(): number {
    return this.receive?.count ?? 0;
  }

  // TODO: reshape for Supabase schema when LoadAdapter is implemented
  /**
   * Convert to plain object for serialization
   */
  toPlain(): Record<string, unknown> {
    return {
      currencyTypeName: this.currencyTypeName,
      chaosEquivalent: this.chaosEquivalent,
      ...(this.receive && { receive: this.receive }),
    };
  }
}
