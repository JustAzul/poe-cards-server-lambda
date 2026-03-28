import { DivinationCard } from '@domain/entities/card.entity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import {
  createCurrencyRewardSpec,
  createItemRewardSpec,
} from '@domain/value-objects/reward-spec';
import { Logger } from '@shared/logger';

export interface ExplicitModifier {
  text: string;
  optional: boolean;
}

export interface DivinationCardLine {
  name: string;
  explicitModifiers?: ExplicitModifier[];
}

interface ParseResult {
  card: DivinationCard | null;
  skipped: boolean;
  reason?: string;
}

const TAG_TO_ITEM_CLASS: Record<string, ItemClass> = {
  uniqueitem: ItemClass.UNIQUE,
  divination: ItemClass.DIVINATION_CARD,
  gemitem: ItemClass.SKILL_GEM,
};

const UNSUPPORTED_TAGS = new Set([
  'whiteitem',
  'magicitem',
  'rareitem',
  'normal',
]);

const GENERIC_GEM_PATTERNS = [
  /Gem$/,
  /Exceptional/,
  /Transfigured/,
  /,/,
];

const GEM_NAME_SUFFIXES: Record<string, string> = {
  Empower: 'Empower Support',
  Enlighten: 'Enlighten Support',
  Enhance: 'Enhance Support',
};

export class RewardParserService {
  constructor(private readonly logger: Logger) {}

  parseAll(lines: DivinationCardLine[]): DivinationCard[] {
    const cards: DivinationCard[] = [];
    let skippedCount = 0;

    for (const line of lines) {
      const result = this.parseLine(line);
      if (result.card) {
        cards.push(result.card);
      }
      if (result.skipped) {
        skippedCount += 1;
      }
    }

    this.logger.log(`[RewardParser] Parsed ${cards.length}/${lines.length} divination cards (${skippedCount} skipped)`);

    return cards;
  }

  parseLine(line: DivinationCardLine): ParseResult {
    const { explicitModifiers } = line;

    if (!explicitModifiers || explicitModifiers.length === 0) {
      return this.skip(line.name, 'no explicitModifiers', '');
    }

    if (explicitModifiers.some((m) => m.optional)) {
      return this.skip(line.name, 'variant reward (optional modifiers)', explicitModifiers[0].text);
    }

    const rawText = explicitModifiers[0].text;
    if (!rawText) {
      return this.skip(line.name, 'empty modifier text', '');
    }

    const text = RewardParserService.stripSizeWrapper(rawText);

    // Check for unsupported tags first
    const tagName = text.match(/^<(\w+)>/)?.[1];
    if (!tagName) {
      return this.skip(line.name, 'no reward tag found', rawText);
    }

    if (UNSUPPORTED_TAGS.has(tagName)) {
      return this.skip(line.name, `unsupported reward type <${tagName}>`, rawText);
    }

    // Currency is special — different reward spec type
    if (tagName === 'currencyitem') {
      return this.parseCurrency(line.name, text, rawText);
    }

    // Item-based tags (uniqueitem, divination, gemitem)
    const itemClass = TAG_TO_ITEM_CLASS[tagName];
    if (itemClass === undefined) {
      return this.skip(line.name, `unrecognized reward tag <${tagName}>`, rawText);
    }

    if (tagName === 'gemitem') {
      return this.parseGem(line.name, text, rawText);
    }

    return this.parseItemTag(line.name, text, rawText, itemClass);
  }

  private parseCurrency(cardName: string, text: string, rawText: string): ParseResult {
    const content = RewardParserService.extractTagContent(text, 'currencyitem');
    if (!content) {
      return this.skip(cardName, 'malformed <currencyitem> tag', rawText);
    }

    const amountMatch = content.match(/^(\d[\d,]*)x\s+(.+)/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 1;
    const reward = amountMatch ? amountMatch[2] : content;

    const card = new DivinationCard(
      cardName,
      reward,
      createCurrencyRewardSpec(amount),
    );

    return { card, skipped: false };
  }

  private parseGem(cardName: string, text: string, rawText: string): ParseResult {
    const content = RewardParserService.extractTagContent(text, 'gemitem');
    if (!content) {
      return this.skip(cardName, 'malformed <gemitem> tag', rawText);
    }

    const levelMatch = content.match(/^Level\s+(\d+)\s+(.+)/);
    const gemLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0;
    let reward = levelMatch ? levelMatch[2] : content;

    // Skip generic gem categories
    if (GENERIC_GEM_PATTERNS.some((p) => p.test(reward))) {
      return this.skip(cardName, `generic gem category: ${reward}`, rawText);
    }

    // Normalize gem names to match SkillGem market data
    reward = GEM_NAME_SUFFIXES[reward] ?? reward;

    const corrupted = rawText.includes('<corrupted>');

    const card = new DivinationCard(
      cardName,
      reward,
      createItemRewardSpec(ItemClass.SKILL_GEM, corrupted, 0, gemLevel),
    );

    return { card, skipped: false };
  }

  private parseItemTag(
    cardName: string,
    text: string,
    rawText: string,
    itemClass: ItemClass,
  ): ParseResult {
    const tagName = itemClass === ItemClass.DIVINATION_CARD ? 'divination' : 'uniqueitem';
    const content = RewardParserService.extractTagContent(text, tagName);
    if (!content) {
      return this.skip(cardName, `malformed <${tagName}> tag`, rawText);
    }

    const corrupted = rawText.includes('<corrupted>');

    const card = new DivinationCard(
      cardName,
      content,
      createItemRewardSpec(itemClass, corrupted, 0, 0),
    );

    return { card, skipped: false };
  }

  private skip(cardName: string, reason: string, rawText: string): ParseResult {
    this.logger.warn(`[RewardParser] Skipped "${cardName}": ${reason}${rawText ? ` | raw: ${rawText.substring(0, 80)}` : ''}`);
    return { card: null, skipped: true, reason };
  }

  static stripSizeWrapper(text: string): string {
    const match = text.match(/^<size:\d+>\{([\s\S]*)\}$/);
    return match ? match[1] : text;
  }

  static extractTagContent(text: string, tagName: string): string | null {
    const match = text.match(new RegExp(`^<${tagName}>\\{([^}]+)\\}`));
    return match ? match[1].trim() : null;
  }
}
