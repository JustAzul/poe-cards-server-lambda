import { ICardPriceResolver, LeagueData } from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card } from '@domain/entities/card.base.entity';
import { ItemCard } from '@domain/entities/item-card.entity';
import { CurrencyCard } from '@domain/entities/currency-card.entity';
import { ArbitrageEvaluator } from '../profit-calculation.service';

describe('ArbitrageEvaluator', () => {
  let service: ArbitrageEvaluator;
  let mockPriceResolver: jest.Mocked<ICardPriceResolver>;
  let leagueData: LeagueData;

  beforeEach(() => {
    mockPriceResolver = {
      findCardPrice: jest.fn(),
      findRewardPrice: jest.fn(),
    };
    service = new ArbitrageEvaluator(mockPriceResolver);
    leagueData = { items: [], currency: [] };
  });

  describe('evaluateCardArbitrage', () => {
    describe('item cards', () => {
      it('should evaluate arbitrage for valid item card', () => {
        const leagueData: LeagueData = { items: [], currency: [] };

        const cardOverview: ItemOverview = {
          name: 'The Doctor',
          itemClass: 6,
          chaosValue: 500,
          count: 50,
          stackSize: 8,
          artFilename: 'doctor.png',
          flavourText: 'You are the Disease',
        };

        const rewardOverview: ItemOverview = {
          name: 'Headhunter',
          itemClass: 2,
          chaosValue: 5000,
          count: 20,
        };

        const card = new ItemCard('The Doctor', 'Headhunter', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(mockPriceResolver.findCardPrice).toHaveBeenCalledWith(leagueData.items, card.name);
        expect(mockPriceResolver.findRewardPrice).toHaveBeenCalledWith(
          leagueData.items,
          leagueData.currency,
          card,
        );
        expect(result).toBeDefined();
        expect(result?.cardName).toBe('The Doctor');
        expect(result?.cardStack).toBe(8);
        expect(result?.cardChaosPrice).toBe(500);
        expect(result?.rewardName).toBe('Headhunter');
        expect(result?.rewardChaosPrice).toBe(5000);
        expect(result?.cardArtFilename).toBe('doctor.png');
        expect(result?.cardFlavourText).toBe('You are the Disease');
        expect(result?.setChaosPrice).toBe(4000); // 8 * 500
        expect(result?.chaosProfit).toBe(1000); // 5000 - 4000
        expect(result?.isCurrency).toBe(false);
      });

      it('should format gem rewards with level', () => {
        const cardOverview: ItemOverview = {
          name: 'The Wretched',
          itemClass: 6,
          chaosValue: 50,
          count: 100,
          stackSize: 1,
        };

        const rewardOverview: ItemOverview = {
          name: 'Awakened Added Fire Damage Support',
          itemClass: 4, // Gem class
          chaosValue: 200,
          count: 30,
          gemLevel: 5,
        };

        const card = new ItemCard('The Wretched', 'Awakened Added Fire Damage Support', {
          iClass: 4,
          corrupted: false,
          links: 0,
          gemLevel: 5,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result?.rewardName).toBe('Level 5 Awakened Added Fire Damage Support');
      });

      it('should return null when card count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const rewardOverview: ItemOverview = {
          name: 'Test Item',
          itemClass: 2,
          chaosValue: 500,
          count: 20,
        };

        const card = new ItemCard('Test Card', 'Test Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 20,
        };

        const rewardOverview: ItemOverview = {
          name: 'Test Item',
          itemClass: 2,
          chaosValue: 500,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const card = new ItemCard('Test Card', 'Test Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when card not found', () => {
        const card = new ItemCard('Missing Card', 'Test Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(null);
        mockPriceResolver.findRewardPrice.mockReturnValue(null);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when reward not found', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 100,
          count: 20,
        };

        const card = new ItemCard('Test Card', 'Missing Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(null);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });
    });

    describe('currency cards', () => {
      it('should calculate profit for valid currency card', () => {
        const cardOverview: ItemOverview = {
          name: 'The Hoarder',
          itemClass: 6,
          chaosValue: 2,
          count: 200,
          stackSize: 12,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: {
            count: 50,
          },
        };

        const card = new CurrencyCard('The Hoarder', 'Exalted Orb', {
          amount: 1,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.cardName).toBe('The Hoarder');
        expect(result?.rewardName).toBe('Exalted Orb');
        expect(result?.rewardChaosPrice).toBe(150);
        expect(result?.setChaosPrice).toBe(24); // 12 * 2
        expect(result?.chaosProfit).toBe(126); // 150 - 24
        expect(result?.isCurrency).toBe(true);
      });

      it('should format multiple currency rewards', () => {
        const cardOverview: ItemOverview = {
          name: 'Three Faces in the Dark',
          itemClass: 6,
          chaosValue: 0.3,
          count: 500,
          stackSize: 1,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
        };

        const card = new CurrencyCard('Three Faces in the Dark', 'Chaos Orb', {
          amount: 3,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result?.rewardName).toBe('3x Chaos Orb');
        expect(result?.rewardChaosPrice).toBe(3);
      });

      it('should handle Chaos Orb as always trusted', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 0.5,
          count: 15, // Above MIN_TRUST_COUNT
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Chaos Orb',
          chaosEquivalent: 1,
          // No receive data - should still pass for Chaos Orb
        };

        const card = new CurrencyCard('Test Card', 'Chaos Orb', {
          amount: 2,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeDefined();
        expect(result?.rewardChaosPrice).toBe(2);
      });

      it('should return null when card count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 1,
          count: 5, // Below MIN_TRUST_COUNT
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: { count: 50 },
        };

        const card = new CurrencyCard('Test Card', 'Exalted Orb', {
          amount: 1,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });

      it('should return null when currency receive count below minimum trust', () => {
        const cardOverview: ItemOverview = {
          name: 'Test Card',
          itemClass: 6,
          chaosValue: 1,
          count: 20,
        };

        const rewardOverview: CurrencyItem = {
          currencyTypeName: 'Exalted Orb',
          chaosEquivalent: 150,
          receive: { count: 5 }, // Below MIN_TRUST_COUNT
        };

        const card = new CurrencyCard('Test Card', 'Exalted Orb', {
          amount: 1,
        });

        mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
        mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

        const result = service.evaluateCardArbitrage(leagueData, card);

        expect(result).toBeNull();
      });
    });
  });

  describe('findAllArbitrageOpportunities', () => {
    it('should find all profitable opportunities for multiple cards', () => {
      const leagueData: LeagueData = { items: [], currency: [] };

      const card1Overview: ItemOverview = {
        name: 'Card 1',
        itemClass: 6,
        chaosValue: 10,
        count: 50,
        stackSize: 1,
      };

      const card1Reward: ItemOverview = {
        name: 'Item 1',
        itemClass: 2,
        chaosValue: 100,
        count: 20,
      };

      const card2Overview: ItemOverview = {
        name: 'Card 2',
        itemClass: 6,
        chaosValue: 5,
        count: 100,
        stackSize: 1,
      };

      const card2Reward: CurrencyItem = {
        currencyTypeName: 'Chaos Orb',
        chaosEquivalent: 1,
      };

      const cards: Card[] = [
        new ItemCard('Card 1', 'Item 1', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        }),
        new CurrencyCard('Card 2', 'Chaos Orb', {
          amount: 2,
        }),
      ];

      mockPriceResolver.findCardPrice
        .mockReturnValueOnce(card1Overview)
        .mockReturnValueOnce(card2Overview);

      mockPriceResolver.findRewardPrice
        .mockReturnValueOnce(card1Reward)
        .mockReturnValueOnce(card2Reward);

      const result = service.findAllArbitrageOpportunities(leagueData, cards);

      expect(result).toHaveLength(1); // Only card 1 is profitable (100 - 10 = 90)
      expect(result[0].cardName).toBe('Card 1');
      expect(result[0].chaosProfit).toBeGreaterThan(0);
    });

    it('should filter out unprofitable cards', () => {
      const cardOverview: ItemOverview = {
        name: 'Unprofitable Card',
        itemClass: 6,
        chaosValue: 100,
        count: 50,
        stackSize: 1,
      };

      const rewardOverview: ItemOverview = {
        name: 'Low Value Item',
        itemClass: 2,
        chaosValue: 50,
        count: 20,
      };

      const cards: Card[] = [
        new ItemCard('Unprofitable Card', 'Low Value Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        }),
      ];

      mockPriceResolver.findCardPrice.mockReturnValue(cardOverview);
      mockPriceResolver.findRewardPrice.mockReturnValue(rewardOverview);

      const result = service.findAllArbitrageOpportunities(leagueData, cards);

      expect(result).toHaveLength(0);
    });

    it('should filter out cards with missing matches', () => {
      const cards: Card[] = [
        new ItemCard('Missing Card', 'Missing Item', {
          iClass: 2,
          corrupted: false,
          links: 0,
          gemLevel: 0,
        }),
      ];

      mockPriceResolver.findCardPrice.mockReturnValue(null);
      mockPriceResolver.findRewardPrice.mockReturnValue(null);

      const result = service.findAllArbitrageOpportunities(leagueData, cards);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty cards array', () => {
      const result = service.findAllArbitrageOpportunities(leagueData, []);

      expect(result).toEqual([]);
    });
  });
});
