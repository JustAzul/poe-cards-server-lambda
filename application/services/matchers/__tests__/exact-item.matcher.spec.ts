import { ExactItemMatcher } from '../exact-item.matcher';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { ItemCard } from '@domain/entities/card.entity';

describe('ExactItemMatcher', () => {
  let matcher: ExactItemMatcher;
  let mockLeagueData: Array<ItemOverview | CurrencyItem>;

  beforeEach(() => {
    matcher = new ExactItemMatcher();
    mockLeagueData = [];
  });

  describe('matchCard', () => {
    it('should find divination card by name and class', () => {
      const divinationCard: ItemOverview = {
        name: 'The Doctor',
        itemClass: 6,
        chaosValue: 100,
        count: 50,
      };

      mockLeagueData = [divinationCard];

      const result = matcher.matchCard(mockLeagueData, 'The Doctor');

      expect(result).toEqual(divinationCard);
    });

    it('should return null when card not found', () => {
      const otherCard: ItemOverview = {
        name: 'Other Card',
        itemClass: 6,
        chaosValue: 50,
        count: 20,
      };

      mockLeagueData = [otherCard];

      const result = matcher.matchCard(mockLeagueData, 'The Doctor');

      expect(result).toBeNull();
    });

    it('should not match cards with wrong itemClass', () => {
      const nonDivinationCard: ItemOverview = {
        name: 'The Doctor',
        itemClass: 4, // Not divination card class
        chaosValue: 100,
        count: 50,
      };

      mockLeagueData = [nonDivinationCard];

      const result = matcher.matchCard(mockLeagueData, 'The Doctor');

      expect(result).toBeNull();
    });

    it('should not match currency items', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'The Doctor',
        chaosEquivalent: 100,
      };

      mockLeagueData = [currencyItem];

      const result = matcher.matchCard(mockLeagueData, 'The Doctor');

      expect(result).toBeNull();
    });
  });

  describe('matchReward', () => {
    it('should match item with exact criteria', () => {
      const targetItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      mockLeagueData = [targetItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Doctor',
        reward: 'Headhunter',
        rewardSpec: {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(targetItem);
    });

    it('should match corrupted items correctly', () => {
      const corruptedItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 4000,
        count: 5,
        corrupted: true,
        links: 0,
        gemLevel: 0,
      };

      mockLeagueData = [corruptedItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Fiend',
        reward: 'Headhunter',
        rewardSpec: {
          iClass: 2,
          corrupted: true,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(corruptedItem);
    });

    it('should match items with specific link counts', () => {
      const linkedItem: ItemOverview = {
        name: 'Six-Link Chest',
        itemClass: 1,
        chaosValue: 300,
        count: 15,
        corrupted: false,
        links: 6,
        gemLevel: 0,
      };

      mockLeagueData = [linkedItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Chains that Bind',
        reward: 'Six-Link Chest',
        rewardSpec: {
          iClass: 1,
          corrupted: false,
          links: 6,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(linkedItem);
    });

    it('should match gems with specific levels', () => {
      const gem: ItemOverview = {
        name: 'Awakened Added Fire Damage Support',
        itemClass: 4,
        chaosValue: 200,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 5,
      };

      mockLeagueData = [gem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Wretched',
        reward: 'Awakened Added Fire Damage Support',
        rewardSpec: {
          iClass: 4,
          corrupted: false,
          links: 0,
          gemLevel: 5,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(gem);
    });

    it('should return null when no matches exist', () => {
      const item: ItemOverview = {
        name: 'Other Item',
        itemClass: 2,
        chaosValue: 100,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      mockLeagueData = [item];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Doctor',
        reward: 'Headhunter',
        rewardSpec: {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should return null when multiple matches exist (ambiguity)', () => {
      const item1: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      const item2: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 4800,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      mockLeagueData = [item1, item2];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Doctor',
        reward: 'Headhunter',
        rewardSpec: {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match items with different corruption status', () => {
      const normalItem: ItemOverview = {
        name: 'Headhunter',
        itemClass: 2,
        chaosValue: 5000,
        count: 10,
        corrupted: false,
        links: 0,
        gemLevel: 0,
      };

      mockLeagueData = [normalItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Fiend',
        reward: 'Headhunter',
        rewardSpec: {
          iClass: 2,
          corrupted: true, // Looking for corrupted
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match items with different link counts', () => {
      const fiveLinkItem: ItemOverview = {
        name: 'Chest Armor',
        itemClass: 1,
        chaosValue: 200,
        count: 15,
        corrupted: false,
        links: 5,
        gemLevel: 0,
      };

      mockLeagueData = [fiveLinkItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Chains that Bind',
        reward: 'Chest Armor',
        rewardSpec: {
          iClass: 1,
          corrupted: false,
          links: 6, // Looking for 6-link
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should not match gems with different levels', () => {
      const lowLevelGem: ItemOverview = {
        name: 'Awakened Added Fire Damage Support',
        itemClass: 4,
        chaosValue: 100,
        count: 8,
        corrupted: false,
        links: 0,
        gemLevel: 1,
      };

      mockLeagueData = [lowLevelGem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'The Wretched',
        reward: 'Awakened Added Fire Damage Support',
        rewardSpec: {
          iClass: 4,
          corrupted: false,
          links: 0,
          gemLevel: 5, // Looking for level 5
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });

    it('should handle undefined optional properties as default values', () => {
      const item: ItemOverview = {
        name: 'Simple Item',
        itemClass: 2,
        chaosValue: 100,
        count: 10,
        // corrupted, links, gemLevel are undefined
      };

      mockLeagueData = [item];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'Test Card',
        reward: 'Simple Item',
        rewardSpec: {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toEqual(item);
    });

    it('should filter out currency items from item matching', () => {
      const currencyItem: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      mockLeagueData = [currencyItem];

      const cardDetails: ItemCard = {
        type: 'item',
        name: 'Test Card',
        reward: 'Chaos Orb',
        rewardSpec: {
          iClass: 5,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        },
      };

      const result = matcher.matchReward(mockLeagueData, cardDetails);

      expect(result).toBeNull();
    });
  });
});
