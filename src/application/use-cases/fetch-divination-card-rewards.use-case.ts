import InfraException from 'infra/exceptions/infra.exception';
import PoeNinjaService, { PoeNinjaQueryParams } from 'infra/http/poe-ninja';
import parseDivinationCardReward, {
  DivinationCardData,
  DivinationCardReward,
} from 'shared/helpers/parse-divination-card-reward.helper';

export interface FetchDivinationCardRewardsUseCaseInterfaces {
  readonly service: PoeNinjaService;
}

export interface FetchDivinationCardRewardsUseCaseConstructor {
  readonly interfaces: FetchDivinationCardRewardsUseCaseInterfaces;
}

export interface CardRewardResult {
  readonly cardName: string;
  readonly reward: DivinationCardReward;
}

export default class FetchDivinationCardRewardsUseCase {
  private readonly service: PoeNinjaService;

  constructor({ interfaces }: FetchDivinationCardRewardsUseCaseConstructor) {
    this.service = interfaces.service;
  }

  async execute(league: string): Promise<CardRewardResult[]> {
    const params: PoeNinjaQueryParams = { league, type: 'DivinationCard' };
    const { lines } = await this.service.fetchItemOverview<{
      lines: Array<DivinationCardData & { name: string }>;
    }>(params);

    if (!lines) {
      throw new InfraException(
        FetchDivinationCardRewardsUseCase.name,
        'No data found',
      );
    }

    return lines
      .map((line) => {
        const reward = parseDivinationCardReward(line);
        return reward ? { cardName: line.name, reward } : null;
      })
      .filter((entry): entry is CardRewardResult => entry !== null);
  }
}
