import { DivinationCardReward } from 'shared/helpers/parse-divination-card-reward.helper';

export interface IDivinationCardRewardsRepository {
  fetchAll(league: string): Promise<Array<{ cardName: string, reward: DivinationCardReward }>>;
} 