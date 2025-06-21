import { execSync } from 'child_process';
import PoeNinjaService from 'infra/http/poe-ninja';
import type {
  IHttpClient,
  HttpClientGetProps,
  HttpClientResponse,
} from 'application/ports/http-client.interface';
import StatusCode from 'status-code-enum';
import parseDivinationCardReward, { DivinationCardData } from '@/shared/helpers/parse-divination-card-reward.helper';
import { CARDS } from '@/config/cards';
import { CURRENCY_CARDS } from '@/config/currency-cards';

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

  [...CARDS, ...CURRENCY_CARDS].forEach((card) => {
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

  it('should parse cards configuration correctly', () => {
    expect(CARDS).toBeDefined();
    expect(Array.isArray(CARDS)).toBe(true);
    expect(CARDS.length).toBeGreaterThan(0);
    
    // Test that each card has the required properties
    CARDS.forEach(card => {
      expect(card).toHaveProperty('cardName');
      expect(card).toHaveProperty('corrupted');
      expect(card).toHaveProperty('gemLevel');
      expect(card).toHaveProperty('itemClass');
      expect(card).toHaveProperty('links');
      expect(card).toHaveProperty('rewardName');
    });
  });

  it('should parse currency cards configuration correctly', () => {
    expect(CURRENCY_CARDS).toBeDefined();
    expect(Array.isArray(CURRENCY_CARDS)).toBe(true);
    expect(CURRENCY_CARDS.length).toBeGreaterThan(0);
    
    // Test that each currency card has the required properties
    CURRENCY_CARDS.forEach(card => {
      expect(card).toHaveProperty('cardName');
      expect(card).toHaveProperty('amount');
      expect(card).toHaveProperty('rewardName');
    });
  });

  it('should parse divination card rewards', () => {
    const mockCard: DivinationCardData = {
      explicitModifiers: [
        { text: '<uniqueitem>{Headhunter}' }
      ]
    };

    const result = parseDivinationCardReward(mockCard);
    
    expect(result).toBeTruthy();
    expect(result?.name).toBe('Headhunter');
    expect(result?.type).toBe('uniqueitem');
    expect(result?.corrupted).toBe(false);
  });

  it('should handle corrupted rewards', () => {
    const mockCard: DivinationCardData = {
      explicitModifiers: [
        { text: '<corrupted><uniqueitem>{Headhunter}' }
      ]
    };

    const result = parseDivinationCardReward(mockCard);
    
    expect(result).toBeTruthy();
    expect(result?.name).toBe('Headhunter');
    expect(result?.type).toBe('uniqueitem');
    expect(result?.corrupted).toBe(true);
  });
});
