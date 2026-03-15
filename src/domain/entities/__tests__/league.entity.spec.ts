import { League } from '@domain/entities/league.entity';

function buildLeague(overrides: Partial<ConstructorParameters<typeof League>[0]> = {}): League {
  return new League({
    name: 'Settlers',
    ladder: 'Settlers',
    delveEvent: false,
    realm: 'pc',
    startAt: new Date('2025-01-01'),
    endAt: new Date('2025-04-01'),
    ruleIds: [],
    ...overrides,
  });
}

describe('League.isEligible', () => {
  it('should return true for a standard PC league', () => {
    const league = buildLeague();
    expect(league.isEligible()).toBe(true);
  });

  it('should return false for a Solo Self Found league', () => {
    const league = buildLeague({ ruleIds: ['NoParties'] });
    expect(league.isEligible()).toBe(false);
  });

  it('should return false for a Ruthless league', () => {
    const league = buildLeague({ ruleIds: ['HardMode'] });
    expect(league.isEligible()).toBe(false);
  });

  it('should return false for a console league', () => {
    const league = buildLeague({ realm: 'sony' });
    expect(league.isEligible()).toBe(false);
  });

  it('should return false for the Hardcore league', () => {
    const league = buildLeague({ name: 'Hardcore' });
    expect(league.isEligible()).toBe(false);
  });

  it('should return false for a league that has not started', () => {
    const league = buildLeague({ startAt: null });
    expect(league.isEligible()).toBe(false);
  });
});
