import { RewardParserService, DivinationCardLine } from '@domain/services/reward-parser.service';
import { RewardType } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';

function line(name: string, text: string, optional = false): DivinationCardLine {
  return { name, explicitModifiers: [{ text, optional }] };
}

// Parse warn message: '[RewardParser] Skipped "${cardName}": ${reason}[ | raw: ${rawText}]'
function parseSkipWarn(msg: string): { cardName: string; reason: string; rawText: string } {
  const match = msg.match(/\[RewardParser\] Skipped "([^"]+)": (.+?)(?:\s+\| raw: (.*))?$/s);
  if (!match) return { cardName: '', reason: msg, rawText: '' };
  return { cardName: match[1], reason: match[2], rawText: match[3] ?? '' };
}

describe('RewardParserService', () => {
  let parser: RewardParserService;
  let skipped: { cardName: string; reason: string; rawText: string }[];
  let logged: string[];

  beforeEach(() => {
    skipped = [];
    logged = [];
    const logger = {
      warn: (msg: string) => { skipped.push(parseSkipWarn(msg)); },
      log: (msg: string) => { logged.push(msg); },
      // eslint-disable-next-line no-empty-function
      error: () => {},
    };
    parser = new RewardParserService(logger);
  });

  describe('unique item rewards', () => {
    it('should parse <uniqueitem>{Name}', () => {
      // Real: The Doctor → Headhunter
      const result = parser.parseLine(
        line('The Doctor', '<uniqueitem>{Headhunter}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.name).toBe('The Doctor');
      expect(result.card!.reward).toBe('Headhunter');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.ITEM,
        itemClass: ItemClass.UNIQUE,
        corrupted: false,
        gemLevel: 0,
      });
    });

    it('should detect corruption from modifier text', () => {
      // Real: The Price of Devotion → Mageblood (corrupted)
      const result = parser.parseLine(
        line('The Price of Devotion', '<uniqueitem>{Mageblood}\n<default>{Quality:} <augmented>{+20%}\n<corrupted>{Two-Implicit}\n<corrupted>{Corrupted}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.reward).toBe('Mageblood');
      expect(result.card!.rewardSpec).toMatchObject({
        type: RewardType.ITEM,
        itemClass: ItemClass.UNIQUE,
        corrupted: true,
      });
    });

    it('should handle names with apostrophes', () => {
      // Real: Reflection of the Heart → Kalandra's Touch
      const result = parser.parseLine(
        line('Reflection of the Heart', "<uniqueitem>{Kalandra's Touch}"),
      );

      expect(result.card!.reward).toBe("Kalandra's Touch");
    });
  });

  describe('currency rewards', () => {
    it('should parse currency with amount prefix', () => {
      // Real: Abandoned Wealth → 3x Exalted Orb
      const result = parser.parseLine(
        line('Abandoned Wealth', '<currencyitem>{3x Exalted Orb}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.name).toBe('Abandoned Wealth');
      expect(result.card!.reward).toBe('Exalted Orb');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.CURRENCY,
        amount: 3,
      });
    });

    it('should parse currency without amount (defaults to 1)', () => {
      // Real: House of Mirrors → Mirror of Kalandra
      const result = parser.parseLine(
        line('House of Mirrors', '<currencyitem>{Mirror of Kalandra}'),
      );

      expect(result.card!.reward).toBe('Mirror of Kalandra');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.CURRENCY,
        amount: 1,
      });
    });

    it('should parse large currency amounts', () => {
      // Real: The Sephirot → 10x Divine Orb
      const result = parser.parseLine(
        line('The Sephirot', '<currencyitem>{10x Divine Orb}'),
      );

      expect(result.card!.reward).toBe('Divine Orb');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.CURRENCY,
        amount: 10,
      });
    });

    it('should parse amounts with commas', () => {
      // Real: History → 2x Hinekora's Lock (testing comma-separated thousands)
      const result = parser.parseLine(
        line('Test Card', '<currencyitem>{1,500x Vivid Crystallised Lifeforce}'),
      );

      expect(result.card!.reward).toBe('Vivid Crystallised Lifeforce');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.CURRENCY,
        amount: 1500,
      });
    });
  });

  describe('divination card chain rewards', () => {
    it('should parse <divination>{Name}', () => {
      // Real: The Immortal → House of Mirrors
      const result = parser.parseLine(
        line('The Immortal', '<divination>{House of Mirrors}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.reward).toBe('House of Mirrors');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.ITEM,
        itemClass: ItemClass.DIVINATION_CARD,
        corrupted: false,
        gemLevel: 0,
      });
    });

    it('should parse The Nurse → The Doctor chain', () => {
      const result = parser.parseLine(
        line('The Nurse', '<divination>{The Doctor}'),
      );

      expect(result.card!.name).toBe('The Nurse');
      expect(result.card!.reward).toBe('The Doctor');
      expect(result.card!.rewardSpec).toMatchObject({
        itemClass: ItemClass.DIVINATION_CARD,
      });
    });
  });

  describe('gem rewards', () => {
    it('should parse gem with level and corruption', () => {
      // Real: The Dragon's Heart → Level 4 Empower (corrupted)
      const result = parser.parseLine(
        line("The Dragon's Heart", '<gemitem>{Level 4 Empower}\n<corrupted>{Corrupted}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.reward).toBe('Empower Support');
      expect(result.card!.rewardSpec).toEqual({
        type: RewardType.ITEM,
        itemClass: ItemClass.SKILL_GEM,
        corrupted: true,
        gemLevel: 4,
      });
    });

    it('should normalize Enlighten → Enlighten Support', () => {
      // Real: The Enlightened → Level 3 Enlighten
      const result = parser.parseLine(
        line('The Enlightened', '<gemitem>{Level 3 Enlighten}'),
      );

      expect(result.card!.reward).toBe('Enlighten Support');
      expect(result.card!.rewardSpec).toMatchObject({
        gemLevel: 3,
        corrupted: false,
      });
    });

    it('should normalize Enhance → Enhance Support', () => {
      // Real: The Artist → Level 4 Enhance (corrupted)
      const result = parser.parseLine(
        line('The Artist', '<gemitem>{Level 4 Enhance}\n<corrupted>{Corrupted}'),
      );

      expect(result.card!.reward).toBe('Enhance Support');
      expect(result.card!.rewardSpec).toMatchObject({
        gemLevel: 4,
        corrupted: true,
      });
    });

    it('should parse specific named gems without normalization', () => {
      // Real: A Chilling Wind → Level 21 Vaal Cold Snap (corrupted)
      const result = parser.parseLine(
        line('A Chilling Wind', '<gemitem>{Level 21 Vaal Cold Snap}\n<corrupted>{Corrupted}'),
      );

      expect(result.card!.reward).toBe('Vaal Cold Snap');
      expect(result.card!.rewardSpec).toMatchObject({
        gemLevel: 21,
        corrupted: true,
      });
    });

    it('should parse gems without level prefix', () => {
      // Real: Grave Knowledge → Summon Raging Spirit (no level)
      const result = parser.parseLine(
        line('Grave Knowledge', '<gemitem>{Summon Raging Spirit}\n<default>{Quality:} <augmented>{+20%}'),
      );

      expect(result.card!.reward).toBe('Summon Raging Spirit');
      expect(result.card!.rewardSpec).toMatchObject({
        gemLevel: 0,
      });
    });

    it('should skip generic gem category ending in Gem', () => {
      // Real: The Wilted Rose → Level 21 Aura Gem
      const result = parser.parseLine(
        line('The Wilted Rose', '<gemitem>{Level 21 Aura Gem}\n<corrupted>{Corrupted}'),
      );

      expect(result.card).toBeNull();
      expect(result.skipped).toBe(true);
      expect(skipped[0].reason).toContain('generic gem category');
    });

    it('should skip generic Exceptional gem', () => {
      // Real: The Miracle → Awakened Exceptional Gem
      const result = parser.parseLine(
        line('The Miracle', '<gemitem>{Awakened Exceptional Gem}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toContain('generic gem category');
    });

    it('should skip generic Transfigured gem', () => {
      // Real: The Hook → Level 21 Transfigured Gem
      const result = parser.parseLine(
        line('The Hook', '<gemitem>{Level 21 Transfigured Gem}\n<default>{Quality:} <augmented>{+23%}\n<corrupted>{Corrupted}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toContain('generic gem category');
    });

    it('should skip multi-choice gem (contains comma)', () => {
      // Real: Gemcutter's Mercy → Empower, Enhance or Enlighten
      const result = parser.parseLine(
        line("Gemcutter's Mercy", '<gemitem>{Empower, Enhance or Enlighten}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toContain('generic gem category');
    });
  });

  describe('size wrapper handling', () => {
    it('should strip <size:N>{...} wrapper and parse inner tag', () => {
      // Real: Dialla's Subjugation → Support Gem (wrapped in size)
      // Using a parseable example instead
      const result = parser.parseLine(
        line('Test Card', '<size:29>{<uniqueitem>{Headhunter}}'),
      );

      expect(result.card).not.toBeNull();
      expect(result.card!.reward).toBe('Headhunter');
    });
  });

  describe('skip scenarios', () => {
    it('should skip cards with no explicitModifiers', () => {
      const result = parser.parseLine({ name: 'Empty Card', explicitModifiers: undefined });

      expect(result.card).toBeNull();
      expect(result.skipped).toBe(true);
      expect(skipped[0].reason).toBe('no explicitModifiers');
    });

    it('should skip cards with empty explicitModifiers array', () => {
      const result = parser.parseLine({ name: 'Empty Card', explicitModifiers: [] });

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('no explicitModifiers');
    });

    it('should skip cards with optional variant modifiers', () => {
      // Real: Desecrated Virtue has optional: true modifier
      const result = parser.parseLine({
        name: 'Desecrated Virtue',
        explicitModifiers: [
          { text: '<size:29>{<gemitem>{Level 6 Awakened Support Gem}}\n<corrupted>{Corrupted}', optional: true },
          { text: '<gemitem>{Level 4 Exceptional Support Gem}\n<corrupted>{Corrupted}', optional: false },
        ],
      });

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('variant reward (optional modifiers)');
    });

    it('should skip <whiteitem> tags', () => {
      // Real: The Catch → Fishing Rod
      const result = parser.parseLine(
        line('The Catch', '<whiteitem>{Fishing Rod}\n<enchanted>{Incubated}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('unsupported reward type <whiteitem>');
    });

    it('should skip <magicitem> tags', () => {
      // Real: Who Asked → Dictator's Weapon
      const result = parser.parseLine(
        line('Who Asked', "<magicitem>{Dictator's Weapon}\n<fractured>{Fractured}"),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('unsupported reward type <magicitem>');
    });

    it('should skip <rareitem> tags', () => {
      // Real: Matryoshka → Onyx Amulet
      const result = parser.parseLine(
        line('Matryoshka', '<rareitem> {Onyx Amulet}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('unsupported reward type <rareitem>');
    });

    it('should skip <normal> tags', () => {
      const result = parser.parseLine(
        line("Cartographer's Delight", '<normal>{Map}\n<default>{Map Tier:} <normal>{5}'),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('unsupported reward type <normal>');
    });

    it('should skip cards with empty modifier text', () => {
      // Real: The Void → empty text
      const result = parser.parseLine(
        line('The Void', ''),
      );

      expect(result.card).toBeNull();
      expect(skipped[0].reason).toBe('empty modifier text');
    });
  });

  describe('parseAll', () => {
    it('should parse multiple cards and return only successful ones', () => {
      const lines: DivinationCardLine[] = [
        line('The Doctor', '<uniqueitem>{Headhunter}'),
        line('Abandoned Wealth', '<currencyitem>{3x Exalted Orb}'),
        line('The Catch', '<whiteitem>{Fishing Rod}'),
        line('The Immortal', '<divination>{House of Mirrors}'),
        line("The Dragon's Heart", '<gemitem>{Level 4 Empower}\n<corrupted>{Corrupted}'),
        line('The Wilted Rose', '<gemitem>{Level 21 Aura Gem}\n<corrupted>{Corrupted}'),
      ];

      const cards = parser.parseAll(lines);

      expect(cards).toHaveLength(4);
      expect(cards.map((c) => c.name)).toEqual([
        'The Doctor',
        'Abandoned Wealth',
        'The Immortal',
        "The Dragon's Heart",
      ]);
      expect(skipped).toHaveLength(2);
    });

    it('should log per-reason skip breakdown', () => {
      const lines: DivinationCardLine[] = [
        line('The Doctor', '<uniqueitem>{Headhunter}'),
        line('The Catch', '<whiteitem>{Fishing Rod}'),
        line('Who Asked', "<magicitem>{Dictator's Weapon}"),
        line('Matryoshka', '<rareitem> {Onyx Amulet}'),
        line('Also White', '<whiteitem>{Diamond Ring}'),
      ];

      parser.parseAll(lines);

      const breakdownLog = logged.find((msg) => msg.includes('Skipped') && msg.includes('{'));
      expect(breakdownLog).toBeDefined();

      const jsonMatch = breakdownLog!.match(/\{.*\}/);
      expect(jsonMatch).not.toBeNull();
      const breakdown = JSON.parse(jsonMatch![0]);

      expect(breakdown['unsupported reward type <whiteitem>']).toBe(2);
      expect(breakdown['unsupported reward type <magicitem>']).toBe(1);
      expect(breakdown['unsupported reward type <rareitem>']).toBe(1);
    });

    it('should not log breakdown when no cards are skipped', () => {
      const lines: DivinationCardLine[] = [
        line('The Doctor', '<uniqueitem>{Headhunter}'),
      ];

      parser.parseAll(lines);

      const breakdownLog = logged.find((msg) => msg.includes('Skipped') && msg.includes('{'));
      expect(breakdownLog).toBeUndefined();
    });

    it('should handle all cards being unparseable', () => {
      const lines: DivinationCardLine[] = [
        line('Card A', '<rareitem>{Onyx Amulet}'),
        line('Card B', '<whiteitem>{Diamond Ring}'),
      ];

      const cards = parser.parseAll(lines);

      expect(cards).toHaveLength(0);
      expect(skipped).toHaveLength(2);
    });

    it('should handle empty input', () => {
      const cards = parser.parseAll([]);

      expect(cards).toHaveLength(0);
    });
  });

  describe('static helpers', () => {
    it('should strip size wrapper correctly', () => {
      expect(RewardParserService.stripSizeWrapper(
        '<size:29>{<gemitem>{Level 6 Awakened Support Gem}}',
      )).toBe('<gemitem>{Level 6 Awakened Support Gem}');
    });

    it('should not modify text without size wrapper', () => {
      expect(RewardParserService.stripSizeWrapper(
        '<uniqueitem>{Headhunter}',
      )).toBe('<uniqueitem>{Headhunter}');
    });

    it('should extract tag content correctly', () => {
      expect(RewardParserService.extractTagContent(
        '<uniqueitem>{Headhunter}\n<corrupted>{Corrupted}',
        'uniqueitem',
      )).toBe('Headhunter');
    });

    it('should return null for missing tag', () => {
      expect(RewardParserService.extractTagContent(
        '<rareitem>{Onyx}',
        'uniqueitem',
      )).toBeNull();
    });
  });
});
