import { DivinationCardItemOverview } from './divination-card-item-overview.type';
import { SkillGemItemOverview } from './skill-gem-item-overview.type';
import { UniqueAccessoryItemOverview } from './unique-accessory-item-overview.type';
import { UniqueArmourItemOverview } from './unique-armour-item-overview.type';
import { UniqueFlaskItemOverview } from './unique-flask-item-overview.type';
import { UniqueJewelItemOverview } from './unique-jewel-item-overview.type';
import { UniqueMapItemOverview } from './unique-map-item-overview.type';
import { UniqueWeaponItemOverview } from './unique-weapon-item-overview.type';

export type ItemOverviewDictionary = {
    DivinationCard: DivinationCardItemOverview;
    SkillGem: SkillGemItemOverview;
    UniqueAccessory: UniqueAccessoryItemOverview;
    UniqueArmour: UniqueArmourItemOverview;
    UniqueFlask: UniqueFlaskItemOverview;
    UniqueJewel : UniqueJewelItemOverview;
    UniqueMap: UniqueMapItemOverview;
    UniqueWeapon: UniqueWeaponItemOverview;
}
