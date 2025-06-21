import {
  IDivinationCardRewardsRepository,
} from '@/application/ports/divination-card-rewards-repository.interface';
import {
  DivinationCardReward,
} from '@/shared/helpers/parse-divination-card-reward.helper';

export interface FetchDivinationCardRewardsUseCaseInterfaces {
  readonly repository: IDivinationCardRewardsRepository;
}

export interface FetchDivinationCardRewardsUseCaseConstructor {
  readonly interfaces: FetchDivinationCardRewardsUseCaseInterfaces;
}

export interface CardRewardResult {
  readonly cardName: string;
  readonly reward: DivinationCardReward;
}

export default class FetchDivinationCardRewardsUseCase {
  private readonly repository: IDivinationCardRewardsRepository;

  constructor({ interfaces }: FetchDivinationCardRewardsUseCaseConstructor) {
    this.repository = interfaces.repository;
  }

  async execute(league: string): Promise<CardRewardResult[]> {
    return this.repository.fetchAll(league);
  }
}
