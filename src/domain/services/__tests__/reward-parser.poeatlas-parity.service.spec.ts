import { readFileSync } from 'fs';
import { join } from 'path';
import { RewardParserService, DivinationCardLine } from '@domain/services/reward-parser.service';
import { RewardType } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { PoeAtlasCardDetail } from '@infrastructure/types/poeatlas.types';

/**
 * FR5 reward-parser parity: poeatlas `explicitModifiers` are byte-compatible with
 * the tags the parser already consumed from poe.ninja. This proves real poeatlas
 * samples (currency / unique / gem / divination) parse to the expected card WITHOUT
 * any change to the (unchanged) parser. Samples are loaded verbatim from the
 * committed poeatlas fixture.
 */
const FIXTURE_PATH = join(
  __dirname,
  '../../../infrastructure/adapters/http/__tests__/__fixtures__/poeatlas-card-details.json',
);
const POEATLAS: PoeAtlasCardDetail[] = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));

function lineFor(cardName: string): DivinationCardLine {
  const entry = POEATLAS.find((c) => c.name === cardName);
  if (!entry) throw new Error(`fixture missing card: ${cardName}`);
  return { name: entry.name, explicitModifiers: entry.explicitModifiers ?? undefined };
}

describe('RewardParserService — poeatlas explicitModifiers parity (FR5)', () => {
  let parser: RewardParserService;

  beforeEach(() => {
    // eslint-disable-next-line no-empty-function
    parser = new RewardParserService({ warn: () => {}, log: () => {}, error: () => {} });
  });

  it('parses a poeatlas <currencyitem> reward with amount and name', () => {
    // Avian Pursuit → <currencyitem>{1,500x Vivid Crystallised Lifeforce}
    const result = parser.parseLine(lineFor('Avian Pursuit'));

    expect(result.card).not.toBeNull();
    expect(result.card!.reward).toBe('Vivid Crystallised Lifeforce');
    expect(result.card!.isCurrencyCard()).toBe(true);
    expect(result.card!.rewardSpec).toEqual({ type: RewardType.CURRENCY, amount: 1500 });
  });

  it('parses a poeatlas <uniqueitem> reward and detects corruption', () => {
    // A Fate Worse Than Death → <uniqueitem>{Cortex}\n<corrupted>{Corrupted}
    const result = parser.parseLine(lineFor('A Fate Worse Than Death'));

    expect(result.card).not.toBeNull();
    expect(result.card!.reward).toBe('Cortex');
    expect(result.card!.rewardSpec).toMatchObject({
      type: RewardType.ITEM,
      itemClass: ItemClass.UNIQUE,
      corrupted: true,
    });
  });

  it('parses a poeatlas <gemitem> reward with gem level', () => {
    // Bound by Flame → <gemitem>{Level 21 Flame Link}\n<default>{Quality:} <augmented>{+20%}
    const result = parser.parseLine(lineFor('Bound by Flame'));

    expect(result.card).not.toBeNull();
    expect(result.card!.reward).toBe('Flame Link');
    expect(result.card!.rewardSpec).toMatchObject({
      type: RewardType.ITEM,
      itemClass: ItemClass.SKILL_GEM,
      gemLevel: 21,
    });
  });

  it('parses a poeatlas <divination> (card→card chain) reward', () => {
    // The Nurse → <divination>{The Doctor}
    const result = parser.parseLine(lineFor('The Nurse'));

    expect(result.card).not.toBeNull();
    expect(result.card!.reward).toBe('The Doctor');
    expect(result.card!.rewardSpec).toMatchObject({
      type: RewardType.ITEM,
      itemClass: ItemClass.DIVINATION_CARD,
    });
  });

  it('skips a poeatlas <whiteitem> reward (unsupported tag) without error', () => {
    // Bowyer's Dream → <whiteitem>{Six-Link Harbinger Bow}
    const result = parser.parseLine(lineFor("Bowyer's Dream"));

    expect(result.card).toBeNull();
    expect(result.skipped).toBe(true);
  });
});
