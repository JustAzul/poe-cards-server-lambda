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
const LEVEL_TOKEN = /Level\s+\d+\s+/i;
const SUPPORT_SUFFIX = /\s+Support$/i;

export default function parseDivinationCardReward(
  card: DivinationCardData,
): DivinationCardReward | null {
  if (!card.explicitModifiers?.length) {
    return null;
  }

  const text = card.explicitModifiers.map((m) => m.text).join('\n');

  let reward: { name: string; type: string } | null = null;
  let corrupted = false;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const tag = match[1].toLowerCase();
    const content = match[2];

    if (tag === 'corrupted') {
      corrupted = true;
      continue;
    }

    if (!reward && (/item$/.test(tag) || tag === 'divination')) {
      let name = content
        .replace(QUANTITY_PREFIX, '')
        .replace(LEVEL_TOKEN, '')
        .trim();

      if (tag === DivinationCardRewardType.GemItem && SUPPORT_SUFFIX.test(name)) {
        name = name.replace(SUPPORT_SUFFIX, '');
      }

      reward = { name, type: tag };
    }
  }

  return reward ? { ...reward, corrupted } : null;
}
