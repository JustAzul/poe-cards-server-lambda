import { ItemClassDictionary } from './item-class-dictionary.enum';
import { ItemOverview } from './item-overview.type';

export type SkillGemItemOverview = Omit<ItemOverview, 'itemClass'> & {
  corrupted: boolean;
  gemLevel: number;
  gemQuality: number;
  itemClass: ItemClassDictionary.SKILL_GEM;
  levelRequired: number;
  variant: never;
};
