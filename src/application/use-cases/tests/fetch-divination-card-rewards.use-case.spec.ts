import { IDivinationCardRewardsRepository } from 'application/ports/divination-card-rewards-repository.interface';
import FetchDivinationCardRewardsUseCase from 'application/use-cases/fetch-divination-card-rewards.use-case';

describe(FetchDivinationCardRewardsUseCase.name, () => {
  it('should return rewards from the repository', async () => {
    const mockParsedRewards = [{ cardName: 'The Doctor', reward: {} as any }];

    const repository: IDivinationCardRewardsRepository = {
      fetchAll: jest.fn(),
    };
    (repository.fetchAll as jest.Mock).mockResolvedValue(mockParsedRewards);

    const useCase = new FetchDivinationCardRewardsUseCase({
      interfaces: { repository },
    });
    const result = await useCase.execute('Standard');

    expect(repository.fetchAll).toHaveBeenCalledWith('Standard');
    expect(result).toEqual(mockParsedRewards);
  });

  it('throws when repository fails', async () => {
    const repository: IDivinationCardRewardsRepository = {
      fetchAll: jest.fn(),
    };
    (repository.fetchAll as jest.Mock).mockRejectedValue(new Error('Repo down'));

    const useCase = new FetchDivinationCardRewardsUseCase({
      interfaces: { repository },
    });

    await expect(useCase.execute('Sanctum')).rejects.toThrow('Repo down');
  });
});
