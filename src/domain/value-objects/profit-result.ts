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
   * Check if arbitrage opportunity is viable (profitable)
   */
  isViable(): boolean {
    return this.chaosProfitValue > 0;
  }
}
