import FetchDivinationCardRewardsUseCase from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import ParseCardRewardUseCase, { ParsedCardResult, ParsedCurrencyResult } from '@/application/use-cases/parse-card-reward.use-case';

export interface CardConfiguration {
  cards: ParsedCardResult[];
  currencyCards: ParsedCurrencyResult[];
}

export class CardConfigurationService {
  constructor(
    private fetchDivinationCardRewardsUseCase: FetchDivinationCardRewardsUseCase,
    private parseCardRewardUseCase: ParseCardRewardUseCase
  ) {}

  async buildConfiguration(league: string): Promise<CardConfiguration> {
    try {
      const cardRewards = await this.fetchDivinationCardRewardsUseCase.execute(league);
      
      const cards: ParsedCardResult[] = [];
      const currencyCards: ParsedCurrencyResult[] = [];

      for (const cardReward of cardRewards) {
        try {
          const parsed = this.parseCardRewardUseCase.execute(cardReward);
          
          if ('amount' in parsed) {
            currencyCards.push(parsed);
          } else {
            cards.push(parsed);
          }
        } catch (error) {
          // Skip invalid cards and continue processing
          console.warn(`Failed to parse card reward for ${cardReward.cardName}:`, error);
        }
      }

      return { cards, currencyCards };
    } catch (error) {
      console.error('Failed to build card configuration:', error);
      return { cards: [], currencyCards: [] };
    }
  }
} 