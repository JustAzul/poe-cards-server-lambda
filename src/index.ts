/* eslint-disable no-console */

import FindLeaguesUseCase from 'application/use-cases/find-leagues.use-case';
import FetchFlipDataUseCase from 'application/use-cases/fetch-flip-data.use-case';
import GenerateFlipTableUseCase from 'application/use-cases/generate-flip-table.use-case';
import FETCH_LIST from 'config/fetch-list';
import CARDS from 'config/cards';
import CURRENCY_CARDS from 'config/currency-cards';
import { ItemClass } from 'domain/entities/item-class.enum';
import HttpClient from 'infra/http/client';
import HttpLeagueRepository from 'infra/http/league/league.repository';
import PoeNinjaService from 'infra/http/poe-ninja';
import HttpItemOverviewRepository from 'infra/http/poe-ninja/item-overview.repository';
import HttpCurrencyOverviewRepository from 'infra/http/poe-ninja/currency-overview.repository';
import ConsoleFlipTableRepository from 'infra/console-flip-table.repository';

import type {
  APIGatewayEvent,
  APIGatewayProxyCallback,
  Context,
} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
  const httpClient = new HttpClient();

  const leagueRepository = new HttpLeagueRepository(httpClient);
  const poeNinjaService = new PoeNinjaService(httpClient);

  const itemRepository = new HttpItemOverviewRepository(poeNinjaService);
  const currencyRepository = new HttpCurrencyOverviewRepository(poeNinjaService);
  const flipTableRepository = new ConsoleFlipTableRepository();

  const findLeaguesUseCase = new FindLeaguesUseCase({
    interfaces: {
      leagueRepository,
    },
  });

  const fetchFlipDataUseCase = new FetchFlipDataUseCase({
    interfaces: { itemRepository, currencyRepository },
    config: { itemTypes: FETCH_LIST },
  });

  const leagueEntities = await findLeaguesUseCase.execute();
  const leagues = leagueEntities.map((l) => l.name);

  const leagueData = await fetchFlipDataUseCase.execute(leagues);

  for (const league of leagues) {
    const { items, currencies } = leagueData[league];

    const exaltedPriceChaos =
      currencies.find((c) => c.name === 'Exalted Orb')?.chaosValue ?? 0;

    const cardRows = CARDS.map((card) => {
      const cardItem = items.find(
        (i) => i.name === card.cardName && i.itemClass === ItemClass.DivinationCard,
      );
      const rewardItem = items.find(
        (i) => i.name === card.rewardName && i.itemClass === card.itemClass,
      );

      return {
        cardPriceChaos: cardItem?.chaosValue ?? 0,
        name: card.cardName,
        rewardChaos: rewardItem?.chaosValue ?? 0,
        setSize: cardItem?.stackSize ?? 0,
      };
    });

    const currencyCardRows = CURRENCY_CARDS.map((card) => {
      const cardItem = items.find(
        (i) => i.name === card.cardName && i.itemClass === ItemClass.DivinationCard,
      );
      const currencyItem = currencies.find((c) => c.name === card.rewardName);

      return {
        cardPriceChaos: cardItem?.chaosValue ?? 0,
        currencyChaos: (currencyItem?.chaosValue ?? 0) * card.amount,
        name: card.cardName,
        setSize: card.amount,
      };
    });

    const flipTable = GenerateFlipTableUseCase.execute({
      cards: cardRows,
      currencyCards: currencyCardRows,
      exaltedPriceChaos,
    });

    await flipTableRepository.save(flipTable, league);
  }
}

const handler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback,
): Promise<void> => {
  try {
    await main();
    callback(null, {
      body: JSON.stringify('Job done.'),
      statusCode: 200,
    });
  } catch (e) {
    if (e instanceof Error) {
      callback(e, {
        body: JSON.stringify(e.message),
        statusCode: 500,
      });

      return;
    }

    callback(null, {
      body: JSON.stringify(e),
      statusCode: 500,
    });
  }
};

if (process.env.NODE_ENV === 'development') {
  process.nextTick(async () => main());
}

export { handler, main };
