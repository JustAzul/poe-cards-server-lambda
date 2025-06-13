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
}

const TOKEN_PATTERN = /<([^>]+)>{([^{}]*?)}/g;
const QUANTITY_PREFIX = /^\d+x\s*/i;
const LEVEL_PREFIX = /^Level\s+\d+\s+/i;

export default function parseDivinationCardReward(
  card: DivinationCardData,
): DivinationCardReward | null {
  const text = card.explicitModifiers?.map((m) => m.text).join('\n');
  if (!text) return null;

  let reward: { name: string; type: string } | null = null;
  let corrupted = false;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const tag = match[1].toLowerCase();
    const content = match[2];

    if (tag === 'corrupted' && content.toLowerCase() === 'corrupted') {
      corrupted = true;
      continue;
    }

    if (!reward && (/item$/.test(tag) || tag === 'divination')) {
      let name = content
        .replace(QUANTITY_PREFIX, '')
        .replace(LEVEL_PREFIX, '')
        .trim();
      reward = { name, type: tag };
    }
  }

  return reward ? { ...reward, corrupted } : null;
}
