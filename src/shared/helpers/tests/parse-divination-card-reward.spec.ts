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
      quantity: 19,
    });
  });

  it('extracts comma-separated quantities', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<currencyitem>{1,500x Vivid Crystallised Lifeforce}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Vivid Crystallised Lifeforce',
      type: DivinationCardRewardType.CurrencyItem,
      corrupted: false,
      quantity: 1500,
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
      level: 4,
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
      level: 3,
    });
  });

  it('returns null when modifier is missing', () => {
    expect(parseDivinationCardReward({})).toBeNull();
  });

  it('flags corruption for non-standard corrupted tags', () => {
    const card: DivinationCardData = {
      explicitModifiers: [
        { text: '<uniqueitem>{Headhunter}\n<corrupted>{Six-Linked}' },
      ],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Headhunter',
      type: DivinationCardRewardType.UniqueItem,
      corrupted: true,
    });
  });

  it('extracts links from six-link rewards', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Link Imperial Bow}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Imperial Bow',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
  });

  it('extracts links from six-linked rewards', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Linked Body Armour}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Body Armour',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
  });

  it('extracts sockets from six-socket rewards', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socket Staff}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
  });

  it('extracts sockets from six-socketed rewards', () => {
    const card: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socketed Bow}' }],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Bow',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
  });

  it('parses levelled gem reward in the middle of the string', () => {
    const card: DivinationCardData = {
      explicitModifiers: [
        { text: '<gemitem>{Awakened Level 5 Multistrike Support}' },
      ],
    };

    expect(parseDivinationCardReward(card)).toEqual({
      name: 'Awakened Multistrike',
      type: DivinationCardRewardType.GemItem,
      corrupted: false,
      level: 5,
    });
  });

  it('fails to parse both Six-Link and Six-Linked rewards due to regex bug', () => {
    const cardLink: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Link Staff}' }],
    };
    const cardLinked: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Linked Staff}' }],
    };
    const cardSocket: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socket Staff}' }],
    };
    const cardSocketed: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socketed Staff}' }],
    };
    // Both should parse as 6 links/sockets, but current regex bug causes one to fail
    expect(parseDivinationCardReward(cardLink)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
    expect(parseDivinationCardReward(cardLinked)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
    expect(parseDivinationCardReward(cardSocket)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
    expect(parseDivinationCardReward(cardSocketed)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
  });

  it('correctly parses only valid link/socket forms and rejects invalid ones', () => {
    const validLink: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Link Staff}' }],
    };
    const validLinked: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Linked Staff}' }],
    };
    const invalidLinkk: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Linkk Staff}' }],
    };
    const invalidLinkeded: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Linkeded Staff}' }],
    };
    const validSocket: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socket Staff}' }],
    };
    const validSocketed: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socketed Staff}' }],
    };
    const invalidSocketted: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socketted Staff}' }],
    };
    const invalidSocketeddd: DivinationCardData = {
      explicitModifiers: [{ text: '<whiteitem>{Six-Socketeddd Staff}' }],
    };
    // Valid forms should parse
    expect(parseDivinationCardReward(validLink)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
    expect(parseDivinationCardReward(validLinked)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      links: 6,
    });
    expect(parseDivinationCardReward(validSocket)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
    expect(parseDivinationCardReward(validSocketed)).toEqual({
      name: 'Staff',
      type: 'whiteitem',
      corrupted: false,
      sockets: 6,
    });
    // Invalid forms should not parse as links/sockets
    expect(parseDivinationCardReward(invalidLinkk)).toEqual({
      name: 'Six-Linkk Staff',
      type: 'whiteitem',
      corrupted: false,
    });
    expect(parseDivinationCardReward(invalidLinkeded)).toEqual({
      name: 'Six-Linkeded Staff',
      type: 'whiteitem',
      corrupted: false,
    });
    expect(parseDivinationCardReward(invalidSocketted)).toEqual({
      name: 'Six-Socketted Staff',
      type: 'whiteitem',
      corrupted: false,
    });
    expect(parseDivinationCardReward(invalidSocketeddd)).toEqual({
      name: 'Six-Socketeddd Staff',
      type: 'whiteitem',
      corrupted: false,
    });
  });
});
