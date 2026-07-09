import { CurrencyItem } from '@domain/value-objects/currency-item';

function makeCurrency(volumePrimaryValue?: number): CurrencyItem {
  return new CurrencyItem({
    currencyTypeName: 'Orb of Annulment',
    chaosEquivalent: 46.57,
    volumePrimaryValue,
  });
}

describe('CurrencyItem.getVolume', () => {
  it('should return the traded volume when present', () => {
    expect(makeCurrency(20794).getVolume()).toBe(20794);
  });

  it('should return 0 when volume is undefined (treats missing data as no liquidity)', () => {
    expect(makeCurrency(undefined).getVolume()).toBe(0);
  });

  it('should still identify the Chaos Orb baseline', () => {
    expect(new CurrencyItem({ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 }).isChaosOrb()).toBe(true);
  });
});
