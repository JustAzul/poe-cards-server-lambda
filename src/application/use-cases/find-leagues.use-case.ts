import LeagueEntity from 'domain/entities/league.entity';
import { ILeagueRepository } from 'application/ports/http-repository.interface';

export interface FindLeaguesUseCaseInterfaces {
  readonly leagueRepository: ILeagueRepository;
}

export interface FindLeaguesUseCaseConstructor {
  readonly interfaces: FindLeaguesUseCaseInterfaces;
}

export default class FindLeaguesUseCase {
  private readonly interfaces: FindLeaguesUseCaseInterfaces;

  constructor({ interfaces }: FindLeaguesUseCaseConstructor) {
    this.interfaces = interfaces;
  }

  async execute(): Promise<LeagueEntity[]> {
    const { leagueRepository } = this.interfaces;
    const results = await leagueRepository.fetchAll();

    return results
      .filter((result) => result.shouldFilter() === false)
      .sort((a, b) => {
        // Sort alphabetically
        if (a.name < b.name) {
          return -1;
        }

        if (a.name > b.name) {
          return 1;
        }

        return 0;
      });
  }
}
