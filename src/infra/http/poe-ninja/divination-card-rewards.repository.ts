import { IDivinationCardRewardsRepository } from 'application/ports/divination-card-rewards-repository.interface';
import {
  CardRewardResult,
} from 'application/use-cases/fetch-divination-card-rewards.use-case';
import InfraException from 'infra/exceptions/infra.exception';
import PoeNinjaService, { PoeNinjaQueryParams } from 'infra/http/poe-ninja';
import parseDivinationCardReward, {
  DivinationCardData,
} from 'shared/helpers/parse-divination-card-reward.helper';

export default class DivinationCardRewardsRepository
  implements IDivinationCardRewardsRepository {
  constructor(private readonly poeNinjaService: PoeNinjaService) {}

  async fetchAll(league: string): Promise<CardRewardResult[]> {
    const params: PoeNinjaQueryParams = { league, type: 'DivinationCard' };
    const { lines } = await this.poeNinjaService.fetchItemOverview<{
      lines: Array<DivinationCardData & { name: string }>;
    }>(params);

    if (!lines) {
      throw new InfraException(
        DivinationCardRewardsRepository.name,
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