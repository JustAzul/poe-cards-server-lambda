export interface DivinationCardData {
  explicitModifiers?: { text: string }[];
}

export enum DivinationCardRewardType {
  CurrencyItem = 'currencyitem',
  UniqueItem = 'uniqueitem',
  GemItem = 'gemitem',
  DivinationCard = 'divination',
}

export interface DivinationCardReward {
  name: string;
  type: string;
  corrupted: boolean;
  amount?: number;
  links?: number;
  sockets?: number;
  level?: number;
}

const TOKEN_PATTERN = /<([^>]+)>{([^{}]*?)}/g;
const QUANTITY_PREFIX = /^(\d+)x\s+/i;
const LEVEL_PATTERN = /Level\s+(\d+)\s*/i;
const SUPPORT_SUFFIX = /\s+Support$/i;
const LINK_PREFIX = /^(?:(?<word>\w+)-Linked?|(?<word2>\w+)-Link)\s+/i;
const SOCKET_PREFIX = /^(?:(?<word>\w+)-Socket(?:ed)?|(?<word2>\w+)-Socketed?)\s+/i;
const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

export default function parseDivinationCardReward(
  card: DivinationCardData,
): DivinationCardReward | null {
  if (!card.explicitModifiers?.length) {
    return null;
  }

  const text = card.explicitModifiers.map((m) => m.text).join('\n');

  let reward: { name: string; type: string } | null = null;
  let corrupted = false;
  let amount: number | undefined;
  let links: number | undefined;
  let sockets: number | undefined;
  let level: number | undefined;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const tag = match[1].toLowerCase();
    const content = match[2];

    if (tag === 'corrupted') {
      corrupted = true;
      continue;
    }

    if (!reward && (/item$/.test(tag) || tag === 'divination')) {
      let name = content;
      const quantityMatch = name.match(QUANTITY_PREFIX);
      if (quantityMatch) {
        amount = parseInt(quantityMatch[1], 10);
        name = name.replace(quantityMatch[0], '');
      }
      const levelMatch = name.match(LEVEL_PATTERN);
      if (levelMatch) {
        level = parseInt(levelMatch[1], 10);
        name = name.replace(levelMatch[0], '');
      }
      name = name.trim();

      const linkMatch = name.match(LINK_PREFIX);
      if (linkMatch) {
        const word = linkMatch.groups?.word || linkMatch.groups?.word2 || '';
        const lower = word.toLowerCase();
        links = NUMBER_WORDS[lower] ?? parseInt(word, 10);
        name = name.slice(linkMatch[0].length);
      }

      const socketMatch = name.match(SOCKET_PREFIX);
      if (socketMatch) {
        const word = socketMatch.groups?.word || socketMatch.groups?.word2 || '';
        const lower = word.toLowerCase();
        sockets = NUMBER_WORDS[lower] ?? parseInt(word, 10);
        name = name.slice(socketMatch[0].length);
      }

      if (tag === DivinationCardRewardType.GemItem && SUPPORT_SUFFIX.test(name)) {
        name = name.replace(SUPPORT_SUFFIX, '');
      }

      reward = { name, type: tag };
    }
  }

  return reward ? { ...reward, corrupted, amount, links, sockets, level } : null;
}
