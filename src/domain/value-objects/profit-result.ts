/**
 * Profit Result - Immutable arbitrage calculation result
 * Value object encapsulating profitability metrics
 */
export class ProfitResult {
  readonly chaosProfitValue: number;

  readonly setChaosPrice: number;

  readonly rewardChaosValue: number;

  readonly roi: number;

  constructor(data: {
    chaosProfitValue: number;
    setChaosPrice: number;
    rewardChaosValue: number;
    roi: number;
  }) {
    this.chaosProfitValue = data.chaosProfitValue;
    this.setChaosPrice = data.setChaosPrice;
    this.rewardChaosValue = data.rewardChaosValue;
    this.roi = data.roi;
  }

  /**
   * Factory method: Create ProfitResult from calculation values
   */
  static create(
    chaosProfitValue: number,
    setChaosPrice: number,
    rewardChaosValue: number,
    roi: number,
  ): ProfitResult {
    return new ProfitResult({
      chaosProfitValue,
      setChaosPrice,
      rewardChaosValue,
      roi,
    });
  }

  /**
   * Check if arbitrage opportunity is viable (profitable)
   */
  isViable(): boolean {
    return this.chaosProfitValue > 0;
  }

  // TODO: reshape for Supabase schema when LoadAdapter is implemented
  /**
   * Convert to plain object for serialization
   */
  toPlain(): Record<string, unknown> {
    return {
      chaosProfitValue: this.chaosProfitValue,
      setChaosPrice: this.setChaosPrice,
      rewardChaosValue: this.rewardChaosValue,
      roi: this.roi,
    };
  }
}
