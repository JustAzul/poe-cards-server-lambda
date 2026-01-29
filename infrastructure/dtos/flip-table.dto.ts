// Input DTO - Card details from repository
export interface CardDetailsDto {
  Name: string;
  Reward: string;
  iClass?: number;
  Corrupted?: boolean;
  Links?: number;
  gemLevel?: number;
  Amount?: number; // For currency cards
}

// Output DTO - Flip table row result
export interface FlipTableRowDto {
  Card: {
    name: string;
    stack: number;
    chaosprice: number;
    exaltedprice: number;
    Details: {
      artFilename: string;
      CardName: string;
      CardStack: number;
      RewardName: string;
      rewardClass: number | string;
      isCorrupted: boolean;
      Flavour: string;
    };
  };
  Reward: {
    name: string;
    chaosprice: number;
    exaltedprice: number;
  };
  setchaosprice: number;
  setexprice: number;
  chaosprofit: number;
  isCurrency: boolean;
}
