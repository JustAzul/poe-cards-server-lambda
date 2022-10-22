import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';

export type SkillGemItemOverview = Omit<ItemOverview, 'itemClass'> & {
  itemClass: ItemClassDictionary.SKILL_GEM;
  corrupted: boolean;
  gemLevel: number;
  gemQuality: number;
  levelRequired: number;
  variant: never;
};
