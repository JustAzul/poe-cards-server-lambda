import { ItemOverview } from '@domain/value-objects/item-overview';
import { ItemClass } from '@domain/value-objects/item-class.enum';

function makeCard(volumePrimaryValue?: number): ItemOverview {
  return new ItemOverview({
    name: 'The Doctor',
    itemClass: ItemClass.DIVINATION_CARD,
    chaosValue: 1000,
    volumePrimaryValue,
  });
}

describe('ItemOverview.getVolume', () => {
  it('should return the traded volume when present', () => {
    expect(makeCard(102).getVolume()).toBe(102);
  });

  it('should return 0 when volume is undefined (treats missing data as no liquidity)', () => {
    expect(makeCard(undefined).getVolume()).toBe(0);
  });
});
