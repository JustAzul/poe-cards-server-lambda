import { DivinationCard } from '@domain/entities/card.entity';
import { createCurrencyRewardSpec, createItemRewardSpec } from '@domain/value-objects/reward-spec';
import { ItemClass } from '@domain/value-objects/item-class.enum';

describe('DivinationCard', () => {
  describe('constructor', () => {
    it('should store name, reward, and rewardSpec correctly', () => {
      const rewardSpec = createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0);
      const card = new DivinationCard('The Doctor', 'Headhunter', rewardSpec);

      expect(card.name).toBe('The Doctor');
      expect(card.reward).toBe('Headhunter');
      expect(card.rewardSpec).toBe(rewardSpec);
    });

    it('should store currency reward spec correctly', () => {
      const rewardSpec = createCurrencyRewardSpec(5);
      const card = new DivinationCard('The Hoarder', 'Exalted Orb', rewardSpec);

      expect(card.name).toBe('The Hoarder');
      expect(card.reward).toBe('Exalted Orb');
      expect(card.rewardSpec).toBe(rewardSpec);
    });
  });

  describe('isCurrencyCard', () => {
    it('should return true when rewardSpec is a currency spec', () => {
      const card = new DivinationCard('The Hoarder', 'Chaos Orb', createCurrencyRewardSpec(1));

      expect(card.isCurrencyCard()).toBe(true);
    });

    it('should return false when rewardSpec is an item spec', () => {
      const card = new DivinationCard(
        'The Doctor',
        'Headhunter',
        createItemRewardSpec(ItemClass.UNIQUE, false, 0, 0),
      );

      expect(card.isCurrencyCard()).toBe(false);
    });

    it('should return false for skill gem item spec', () => {
      const card = new DivinationCard(
        'Dialla\'s Subjugation',
        'Enlighten Support',
        createItemRewardSpec(ItemClass.SKILL_GEM, false, 0, 21),
      );

      expect(card.isCurrencyCard()).toBe(false);
    });

    it('should narrow type so that rewardSpec.amount is accessible after guard', () => {
      const amount = 3;
      const card = new DivinationCard('Brother\'s Gift', 'Divine Orb', createCurrencyRewardSpec(amount));

      if (card.isCurrencyCard()) {
        // Type narrowing: rewardSpec.amount must be accessible without cast
        expect(card.rewardSpec.amount).toBe(amount);
      } else {
        fail('isCurrencyCard() should have returned true');
      }
    });
  });
});
