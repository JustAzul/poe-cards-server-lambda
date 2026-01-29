// Input DTO - Card details from repository
export interface CardDetailsDto {
  name: string;
  reward: string;
  iClass?: number;
  corrupted?: boolean;
  links?: number;
  gemLevel?: number;
  amount?: number; // For currency cards
}

// Output DTO - Flip table row result
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
