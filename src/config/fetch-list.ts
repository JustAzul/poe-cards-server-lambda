export type ItemOverviewType =
  | 'DivinationCard'
  | 'SkillGem'
  | 'UniqueAccessory'
  | 'UniqueArmour'
  | 'UniqueFlask'
  | 'UniqueJewel'
  | 'UniqueMap'
  | 'UniqueWeapon';

const FETCH_LIST: ItemOverviewType[] = [
  'DivinationCard',
  'UniqueArmour',
  'UniqueAccessory',
  'UniqueWeapon',
  'UniqueMap',
  'SkillGem',
  'UniqueFlask',
  'UniqueJewel',
];

export default FETCH_LIST;
