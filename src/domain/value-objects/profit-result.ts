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
    if (!Number.isFinite(data.chaosProfitValue)
      || !Number.isFinite(data.setChaosPrice)
      || !Number.isFinite(data.rewardChaosValue)
      || !Number.isFinite(data.roi)) {
      throw new Error('ProfitResult: all fields must be finite numbers');
    }
    this.chaosProfitValue = data.chaosProfitValue;
    this.setChaosPrice = data.setChaosPrice;
    this.rewardChaosValue = data.rewardChaosValue;
    this.roi = data.roi;
  }

  /**
   * Check if arbitrage opportunity is viable (profitable)
   */
  isViable(): boolean {
    return this.chaosProfitValue > 0;
  }

  equals(other: ProfitResult): boolean {
    return this.chaosProfitValue === other.chaosProfitValue
      && this.setChaosPrice === other.setChaosPrice
      && this.rewardChaosValue === other.rewardChaosValue
      && this.roi === other.roi;
  }
}
