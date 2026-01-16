export interface CardRow {
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

export type FlipTable = CardRow[];
