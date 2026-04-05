// Output DTO - Profit table row result (external representation for API/infrastructure)
export interface ProfitTableRowDto {
  card: {
    name: string;
    stack: number;
    chaosPrice: number;
    details: {
      artFilename: string;
      rewardName: string;
      rewardClass: number | null;
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
