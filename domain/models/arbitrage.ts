/**
 * Pure domain model for arbitrage opportunity
 * Contains all data needed to represent a profitable trading opportunity
 * No infrastructure or presentation concerns
 */
export interface Arbitrage {
  // Card information
  cardName: string;
  cardStack: number;
  cardChaosPrice: number;
  cardArtFilename: string;
  cardFlavourText: string;

  // Reward information
  rewardName: string;
  rewardChaosPrice: number;
  rewardClass: number | string;
  isCorrupted: boolean;

  // Profit metrics
  setChaosPrice: number;
  chaosProfit: number;

  // Type discriminator
  isCurrency: boolean;
}
