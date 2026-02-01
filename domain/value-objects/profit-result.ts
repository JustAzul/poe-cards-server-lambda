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

  /**
   * Get profit tier for categorization
   */
  getProfitTier(): 'low' | 'medium' | 'high' {
    if (this.chaosProfitValue < 10) return 'low';
    if (this.chaosProfitValue < 50) return 'medium';
    return 'high';
  }

  /**
   * Get ROI percentage formatted as string
   */
  getRoiPercentage(): string {
    return `${this.roi.toFixed(2)}%`;
  }

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
