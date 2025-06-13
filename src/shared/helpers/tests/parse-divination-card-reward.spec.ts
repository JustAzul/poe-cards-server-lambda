import parseDivinationCardReward, {
  DivinationCardData,
  DivinationCardRewardType,
} from 'shared/helpers/parse-divination-card-reward.helper';

describe(parseDivinationCardReward.name, () => {
  it('extracts reward from The Doctor', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<uniqueitem>{Headhunter}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Headhunter',
      type: DivinationCardRewardType.UniqueItem,
      corrupted: false,
    });
  });

  it('extracts reward from currency card with quantity', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<currencyitem>{19x Mirror Shard}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Mirror Shard',
      type: DivinationCardRewardType.CurrencyItem,
      corrupted: false,
    });
  });

  it('extracts reward from The Fiend', () => {
    const card: DivinationCardData = {
      explicitModifiers: [
        { text: '<uniqueitem>{Headhunter}\n<corrupted>{Corrupted}' },
      ],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Headhunter',
      type: DivinationCardRewardType.UniqueItem,
      corrupted: true,
    });
  });

  it('extracts reward from The Demon', () => {
    const card: DivinationCardData = {
      explicitModifiers: [
        {
          text:
            '<uniqueitem>{Headhunter}\n<corrupted>{Two-Implicit}\n<corrupted>{Corrupted}',
        },
      ],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Headhunter',
      type: DivinationCardRewardType.UniqueItem,
      corrupted: true,
    });
  });

  it('extracts corrupted gem reward', () => {
    const card: DivinationCardData = {
      explicitModifiers: [
        { text: '<gemitem>{Level 4 Empower}\n<corrupted>{Corrupted}' },
      ],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Empower',
      type: DivinationCardRewardType.GemItem,
      corrupted: true,
    });
  });

  it('extracts gem reward without corruption', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<gemitem>{Level 3 Enlighten}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Enlighten',
      type: DivinationCardRewardType.GemItem,
      corrupted: false,
    });
  });

  it('returns null when modifier is missing', () => {
    expect(parseDivinationCardReward({})).toBeNull();
  });
});
