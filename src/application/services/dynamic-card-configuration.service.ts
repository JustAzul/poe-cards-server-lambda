import FetchDivinationCardRewardsUseCase from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import ParseCardRewardUseCase, { ParsedCardResult, ParsedCurrencyResult } from '@/application/use-cases/parse-card-reward.use-case';

export interface DynamicCardConfiguration {
  cards: ParsedCardResult[];
  currencyCards: ParsedCurrencyResult[];
}

export interface DynamicCardConfigurationServiceDependencies {
  fetchDivinationCardRewardsUseCase: FetchDivinationCardRewardsUseCase;
  parseCardRewardUseCase: ParseCardRewardUseCase;
}

export default class DynamicCardConfigurationService {
  constructor(
    private readonly dependencies: DynamicCardConfigurationServiceDependencies
  ) {}

  async buildConfiguration(league: string): Promise<DynamicCardConfiguration> {
    try {
      const cardRewards = await this.dependencies.fetchDivinationCardRewardsUseCase.execute(league);
      
      const cards: ParsedCardResult[] = [];
      const currencyCards: ParsedCurrencyResult[] = [];

      for (const cardReward of cardRewards) {
        try {
          const parsed = this.dependencies.parseCardRewardUseCase.execute(cardReward);
          
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
      console.error('Failed to build dynamic card configuration:', error);
      return { cards: [], currencyCards: [] };
    }
  }

  async getAvailableCards(league: string): Promise<string[]> {
    try {
      const cardRewards = await this.dependencies.fetchDivinationCardRewardsUseCase.execute(league);
      return cardRewards.map(card => card.cardName);
    } catch (error) {
      console.error('Failed to get available cards:', error);
      return [];
    }
  }

  async getCardsByRewardType(league: string, rewardType: 'currency' | 'unique' | 'gem'): Promise<DynamicCardConfiguration> {
    const configuration = await this.buildConfiguration(league);
    
    switch (rewardType) {
      case 'currency':
        return { cards: [], currencyCards: configuration.currencyCards };
      case 'unique':
        return { 
          cards: configuration.cards.filter(card => card.itemClass === 3), // ItemClass.Unique
          currencyCards: [] 
        };
      case 'gem':
        return { 
          cards: configuration.cards.filter(card => card.itemClass === 4), // ItemClass.Gem
          currencyCards: [] 
        };
      default:
        return configuration;
    }
  }
} 