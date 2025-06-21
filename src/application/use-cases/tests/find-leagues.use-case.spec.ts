import FindLeaguesUseCase from '../find-leagues.use-case';
import LeagueEntity from 'domain/entities/league.entity';
import { ILeagueRepository } from 'application/ports/http-repository.interface';

describe('FindLeaguesUseCase', () => {
  let mockLeagueRepository: jest.Mocked<ILeagueRepository>;
  let fetchAllMock: jest.MockedFunction<any>;
  let useCase: FindLeaguesUseCase;

  beforeEach(() => {
    fetchAllMock = jest.fn() as jest.MockedFunction<any>;
    mockLeagueRepository = {
      fetchAll: fetchAllMock,
    };
    useCase = new FindLeaguesUseCase({
      interfaces: { leagueRepository: mockLeagueRepository },
    });
  });

  describe('execute', () => {
    it('should fetch leagues and filter out leagues that should be filtered', async () => {
      // Arrange
      const standardLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Standard', // Should be filtered
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      const ssfLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'SSF League',
        realm: 'pc',
        rules: [{ id: 'NoParties', name: 'Solo Self-Found', description: 'SSF mode' }], // Should be filtered
        startAt: null,
        url: '',
      });

      const validLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Valid League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([standardLeague, ssfLeague, validLeague]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(fetchAllMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(validLeague);
    });

    it('should sort leagues alphabetically by name', async () => {
      // Arrange
      const leagueZ = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Z League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      const leagueA = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'A League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      const leagueM = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'M League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([leagueZ, leagueA, leagueM]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('A League');
      expect(result[1].name).toBe('M League');
      expect(result[2].name).toBe('Z League');
    });

    it('should handle leagues with identical names (edge case)', async () => {
      // Arrange
      const league1 = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Same Name',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      const league2 = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Same Name',
        realm: 'xbox',
        rules: [],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([league1, league2]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Same Name');
      expect(result[1].name).toBe('Same Name');
    });

    it('should NOT filter out hardcore leagues (they are allowed)', async () => {
      // Arrange
      const hardcoreLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Hardcore League',
        realm: 'pc',
        rules: [{ id: 'Hardcore', name: 'Hardcore', description: 'Hardcore mode' }],
        startAt: null,
        url: '',
      });

      const normalLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Normal League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([hardcoreLeague, normalLeague]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2); // Both leagues should be included
      expect(result).toContain(hardcoreLeague);
      expect(result).toContain(normalLeague);
    });

    it('should filter out ruthless leagues', async () => {
      // Arrange
      const ruthlessLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Ruthless League',
        realm: 'pc',
        rules: [{ id: 'HardMode', name: 'Ruthless', description: 'Ruthless mode' }],
        startAt: null,
        url: '',
      });

      const normalLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Normal League',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([ruthlessLeague, normalLeague]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(normalLeague);
    });

    it('should handle empty league list', async () => {
      // Arrange
      fetchAllMock.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle all leagues being filtered out', async () => {
      // Arrange
      const standardLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'Standard',
        realm: 'pc',
        rules: [],
        startAt: null,
        url: '',
      });

      const ssfLeague = new LeagueEntity({
        delveEvent: false,
        endAt: null,
        id: 'SSF League',
        realm: 'pc',
        rules: [{ id: 'NoParties', name: 'Solo Self-Found', description: 'SSF mode' }],
        startAt: null,
        url: '',
      });

      fetchAllMock.mockResolvedValue([standardLeague, ssfLeague]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Repository failed');
      fetchAllMock.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository failed');
    });

    it('should handle mixed valid and invalid leagues with complex sorting', async () => {
      // Arrange
      const leagues = [
        new LeagueEntity({
          delveEvent: false,
          endAt: null,
          id: 'Zulu League', // Valid, should be last
          realm: 'pc',
          rules: [],
          startAt: null,
          url: '',
        }),
        new LeagueEntity({
          delveEvent: false,
          endAt: null,
          id: 'Standard', // Invalid, should be filtered
          realm: 'pc',
          rules: [],
          startAt: null,
          url: '',
        }),
        new LeagueEntity({
          delveEvent: false,
          endAt: null,
          id: 'Alpha League', // Valid, should be first
          realm: 'pc',
          rules: [],
          startAt: null,
          url: '',
        }),
        new LeagueEntity({
          delveEvent: false,
          endAt: null,
          id: 'SSF Test', // Invalid, should be filtered
          realm: 'pc',
          rules: [{ id: 'NoParties', name: 'Solo Self-Found', description: 'SSF mode' }],
          startAt: null,
          url: '',
        }),
        new LeagueEntity({
          delveEvent: false,
          endAt: null,
          id: 'Beta League', // Valid, should be middle
          realm: 'pc',
          rules: [],
          startAt: null,
          url: '',
        }),
      ];

      fetchAllMock.mockResolvedValue(leagues);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(l => l.name)).toEqual(['Alpha League', 'Beta League', 'Zulu League']);
    });
  });
}); 