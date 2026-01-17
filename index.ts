import { sleep } from 'azul-tools';
import { duration } from 'moment';

// Domain entities
import { League } from '@domain/entities/league.entity';
import { ItemOverview, CurrencyItem } from '@domain/entities/http.entity';

// DTOs
import { FlipTableRowDto } from '@application/dtos/flip-table.dto';

// Interfaces
import { CurrencyOverview } from '@domain/repositories/interfaces/data-storage.repository.interface';

// Repositories
import { leagueRepository } from '@infrastructure/repositories/league.repository';

// Services
import { leagueDataService } from '@application/services/league-data.service';
import { profitCalculationService } from '@application/services/profit-calculation.service';
import { dataStorageService } from '@application/services/data-storage.service';

/** Maps league names to their last update timestamp (ISO string) */
type UpdateTimestamps = Record<string, string>;

/** Maps league names to their flip table results */
type FlipTableResults = Record<string, FlipTableRowDto[]>;

/** Maps league names to their currency data */
type CurrencyResultsMap = Record<string, CurrencyOverview[]>;

/** League data combining items and currency */
type LeagueDataMap = Record<string, Array<ItemOverview | CurrencyItem>>;

/** AWS Lambda response structure */
interface LambdaResponse {
  statusCode: number;
  body: string;
}

/**
 * Type guard to check if an item is a CurrencyItem
 */
function isCurrencyItem(item: ItemOverview | CurrencyItem): item is CurrencyItem {
  return 'currencyTypeName' in item;
}

async function main(): Promise<void> {
  console.log('Fetching Leagues..');
  const Leagues: Record<string, League> = await leagueRepository.getAllLeagues();
  console.log(`Found ${Object.keys(Leagues).length} leagues!`);

  const UpdateLeagueList = async (): Promise<void> => {
    console.log('Storing leagues in memory...');
    await dataStorageService.dataStorageRepository.setLeagues(Leagues);
  };

  await UpdateLeagueList();

  const UpdatedAt: UpdateTimestamps = {};

  const GetLeagueData = async (): Promise<LeagueDataMap> => {
    const LeaguesData: League[] = Object.values(Leagues);
    const Results: LeagueDataMap = {};

    for (let i = 0; i < LeaguesData.length; i += 1) {
      const { leagueName } = LeaguesData[i];

      console.log(`Requesting league '${leagueName}' Overview..`);
      Results[leagueName] = await leagueDataService.fetchLeagueOverview(leagueName);
      UpdatedAt[leagueName] = new Date().toISOString();

      if (i !== LeaguesData.length - 1) {
        console.log('Waiting 2 seconds delay..');
        await sleep(duration(2, 'seconds').asMilliseconds());
      }
    }

    return Results;
  };

  const LeagueDatas: LeagueDataMap = await GetLeagueData();

  console.log('Generating tables and mapping results...');
  const TableResults: FlipTableResults = {};
  const CurrencyResults: CurrencyResultsMap = {};

  {
    const Workload: Promise<void>[] = [];
    const Keys: string[] = Object.keys(LeagueDatas);

    for (let i = 0; i < Keys.length; i += 1) {
      const leagueName: string = Keys[i];

      // Currency mapping workload
      Workload.push(
        new Promise<void>((resolve) => {
          const Result: CurrencyOverview[] = LeagueDatas[leagueName]
            .filter(isCurrencyItem)
            .map((Item: CurrencyItem): CurrencyOverview => ({
              Name: Item.currencyTypeName,
              detailsId: '', // CurrencyItem doesn't have detailsId
              chaosEquivalent: Item.chaosEquivalent,
            }));

          CurrencyResults[leagueName] = Result;
          resolve();
        }),
      );

      // Flip table generation workload
      Workload.push(
        profitCalculationService
          .generateFlipTable(LeagueDatas[leagueName])
          .then((Result: FlipTableRowDto[]): void => {
            TableResults[leagueName] = Result;
          }),
      );
    }

    await Promise.all(Workload);
  }

  console.log('Storing processed data...');
  await dataStorageService.storeAllData(
    Leagues,
    TableResults,
    CurrencyResults,
    UpdatedAt,
  );
}

if (process.env.NODE_ENV === 'development') {
  process.nextTick(async (): Promise<void> => {
    await main();
  });
}

export const handler = async (): Promise<LambdaResponse> => {
  await main();

  const response: LambdaResponse = {
    statusCode: 200,
    body: JSON.stringify('Job done.'),
  };

  return response;
};
