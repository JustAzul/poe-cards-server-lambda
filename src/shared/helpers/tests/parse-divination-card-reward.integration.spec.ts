import { execSync } from 'child_process';
import PoeNinjaService from 'infra/http/poe-ninja';
import type {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from 'application/ports/http-client.interface';
import StatusCode from 'status-code-enum';
import cards from 'config/cards';
import currencyCards from 'config/currency-cards';
import parseDivinationCardReward, {
  DivinationCardData,
} from 'shared/helpers/parse-divination-card-reward.helper';

class CurlHttpClient implements IHttpClient {
  async get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>> {
    const json = execSync(`curl -sL "${props.url}"`).toString();
    const data = JSON.parse(json) as T;
    return { data, headers: {}, statusCode: StatusCode.SuccessOK };
  }
}

describe('Parse divination card reward integration', () => {
  let cardMap: Record<string, DivinationCardData>;

  beforeAll(async () => {
    const service = new PoeNinjaService(new CurlHttpClient());
    const { lines } = await service.fetchItemOverview<{
      lines: Array<DivinationCardData & { name: string }>;
    }>({
      league: 'Standard',
      type: 'DivinationCard',
    });

    cardMap = Object.fromEntries(
      lines.map((line) => [line.name, line]),
    );
  }, 20000);

  [...cards, ...currencyCards].forEach((card) => {
    const cardName = card.cardName;
    const expected = card.rewardName;

    it(`parses reward for ${cardName}`, () => {
      const data = cardMap[cardName];
      expect(data).toBeDefined();
      const reward = parseDivinationCardReward(data);
      expect(reward).not.toBeNull();

      if (!reward) return;
      if (expected.endsWith(' Support')) {
        expect(reward.name).toBe(expected.replace(/ Support$/, ''));
      } else {
        expect(reward.name).toBe(expected);
      }

      if ('links' in card && card.links > 0 && reward.links !== undefined) {
        expect(reward.links).toBe(card.links);
      }

      if ('gemLevel' in card && card.gemLevel > 0 && reward.level !== undefined) {
        expect(reward.level).toBe(card.gemLevel);
      }

      if ('amount' in card && reward.quantity !== undefined) {
        expect(reward.quantity).toBe(card.amount);
      }
    });
  });
});
