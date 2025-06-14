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
  links?: number;
  sockets?: number;
  quantity?: number;
  level?: number;
}

const TOKEN_PATTERN = /<([^>]+)>{([^{}]*?)}/g;
const QUANTITY_PREFIX = /^(?<qty>[\d,]+)x\s*/i;
const LEVEL_PATTERN = /Level\s+(\d+)\s*/i;
const SUPPORT_SUFFIX = /\s+Support$/i;
const LINK_PREFIX = /^(?<word>\w+)-(Linked|Link)\s+/i;
const SOCKET_PREFIX = /^(?<word>\w+)-(Socketed|Socket)\s+/i;
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
  let links: number | undefined;
  let sockets: number | undefined;
  let quantity: number | undefined;
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
      const qtyMatch = name.match(QUANTITY_PREFIX);
      if (qtyMatch?.groups) {
        quantity = parseInt(qtyMatch.groups.qty.replace(/,/g, ''), 10);
        name = name.replace(qtyMatch[0], '');
      }
      name = name.trim();
      const levelMatch = name.match(LEVEL_PATTERN);
      if (levelMatch) {
        level = parseInt(levelMatch[1], 10);
        name = name.replace(levelMatch[0], '');
      }
      name = name.trim();

      const linkMatch = name.match(LINK_PREFIX);
      if (linkMatch) {
        const word = linkMatch.groups?.word || '';
        const lower = word.toLowerCase();
        links = NUMBER_WORDS[lower] ?? parseInt(word, 10);
        name = name.slice(linkMatch[0].length);
      }

      const socketMatch = name.match(SOCKET_PREFIX);
      if (socketMatch) {
        const word = socketMatch.groups?.word || '';
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

  return reward
    ? { ...reward, corrupted, links, sockets, quantity, level }
    : null;
}
