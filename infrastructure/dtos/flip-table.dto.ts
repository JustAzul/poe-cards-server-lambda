// Output DTO - Flip table row result (external representation for API/infrastructure)
export interface FlipTableRowDto {
  Card: {
    name: string;
    stack: number;
    chaosPrice: number;
    details: {
      artFilename: string;
      cardName: string;
      cardStack: number;
      rewardName: string;
      rewardClass: number | string;
      isCorrupted: boolean;
      flavour: string;
    };
  };
  reward: {
    name: string;
    chaosPrice: number;
  };
  setChaosPrice: number;
  chaosProfit: number;
  isCurrency: boolean;
}
