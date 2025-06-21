import 'reflect-metadata';
import { container } from 'tsyringe';

// Application layer imports
import FetchDivinationCardRewardsUseCase, { 
  FetchDivinationCardRewardsUseCaseInterfaces 
} from '@/application/use-cases/fetch-divination-card-rewards.use-case';
import ParseCardRewardUseCase from '@/application/use-cases/parse-card-reward.use-case';
import { CardConfigurationService } from '@/application/services/card-configuration.service';

// Infrastructure layer imports
import DivinationCardRewardsRepository from '@/infra/http/poe-ninja/divination-card-rewards.repository';
import PoeNinjaService from '@/infra/http/poe-ninja/poe-ninja.service';
import AxiosHttpClient from '@/infra/http/client/axios-http-client';
import { IDivinationCardRewardsRepository } from '@/application/ports/divination-card-rewards-repository.interface';

export class DIContainer {
  private static instance: DIContainer;

  private constructor() {
    this.setupDependencies();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private setupDependencies(): void {
    // Infrastructure layer registrations (can use @injectable here)
    container.registerSingleton('HttpClient', AxiosHttpClient);
    container.registerSingleton('PoeNinjaService', PoeNinjaService);
    container.registerSingleton('DivinationCardRewardsRepository', DivinationCardRewardsRepository);

    // Application layer registrations (factory pattern for clean architecture)
    container.register('ParseCardRewardUseCase', {
      useFactory: () => new ParseCardRewardUseCase()
    });

    container.register('FetchDivinationCardRewardsUseCase', {
      useFactory: (container) => {
        const repository = container.resolve('DivinationCardRewardsRepository') as IDivinationCardRewardsRepository;
        const interfaces: FetchDivinationCardRewardsUseCaseInterfaces = {
          repository
        };
        return new FetchDivinationCardRewardsUseCase({ interfaces });
      }
    });

    container.register('CardConfigurationService', {
      useFactory: (container) => {
        const fetchUseCase = container.resolve('FetchDivinationCardRewardsUseCase') as FetchDivinationCardRewardsUseCase;
        const parseUseCase = container.resolve('ParseCardRewardUseCase') as ParseCardRewardUseCase;
        return new CardConfigurationService(fetchUseCase, parseUseCase);
      }
    });
  }

  resolve<T>(token: string): T {
    return container.resolve<T>(token);
  }

  // For testing - allows registration of mocks
  registerMock<T>(token: string, mock: T): void {
    container.registerInstance(token, mock);
  }

  // For testing - clears all instances
  clear(): void {
    container.clearInstances();
  }
} 