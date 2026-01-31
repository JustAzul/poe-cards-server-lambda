import {
  IProfitCalculationService,
  ICardMatcher,
} from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { Card, isItemCard, isCurrencyCard, CurrencyCard } from '@domain/entities/card.entity';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';

// Default instance with concrete dependencies
import { cardRepository as _cardRepository } from '@infrastructure/repositories/card.repository';
import { ExactItemMatcher } from '@application/services/matchers/exact-item.matcher';
import { ExactCurrencyMatcher } from '@application/services/matchers/exact-currency.matcher';

export class ProfitCalculationService implements IProfitCalculationService {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly itemMatcher: ICardMatcher,
    private readonly currencyMatcher: ICardMatcher,
  ) {}

  /**
   * Calculate profit for a single card using domain metadata
   */
  calculateCardProfit(
    leagueData: Array<ItemOverview | CurrencyItem>,
    card: Card,
  ): FlipTableRowDto | null {
    // Use type guards to select matcher based on domain metadata
    if (isItemCard(card)) {
      const cardOverview = this.itemMatcher.matchCard(leagueData, card.name);
      const rewardOverview = this.itemMatcher.matchReward(leagueData, card);

      if (!cardOverview || !rewardOverview) return null;

      // Trust validation using domain metadata
      if (!this.meetsMinimumTrustForItem(cardOverview, rewardOverview as ItemOverview)) {
        return null;
      }

      return ProfitCalculationService.buildItemCardRow(cardOverview, rewardOverview as ItemOverview);
    }

    if (isCurrencyCard(card)) {
      const cardOverview = this.currencyMatcher.matchCard(leagueData, card.name);
      const rewardOverview = this.currencyMatcher.matchReward(leagueData, card);

      if (!cardOverview || !rewardOverview) return null;

      // Trust validation using domain metadata
      if (!this.meetsMinimumTrustForCurrency(cardOverview, rewardOverview as CurrencyItem, card)) {
        return null;
      }

      return ProfitCalculationService.buildCurrencyCardRow(cardOverview, rewardOverview as CurrencyItem, card);
    }

    return null;
  }

  /**
   * Generate complete flip table for all cards
   */
  generateFlipTable(
    leagueData: Array<ItemOverview | CurrencyItem>,
  ): FlipTableRowDto[] {
    // Single batch - no separation needed!
    const allCards = this.cardRepository.getAllCards();

    return allCards
      .map((card) => this.calculateCardProfit(leagueData, card))
      .filter((result): result is FlipTableRowDto => result !== null && result.chaosProfit > 0);
  }

  private meetsMinimumTrustForItem(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview,
  ): boolean {
    const cardCount = cardOverview.count ?? 0;
    const rewardCount = rewardOverview.count ?? 0;

    return cardCount >= this.MIN_TRUST_COUNT && rewardCount >= this.MIN_TRUST_COUNT;
  }

  private meetsMinimumTrustForCurrency(
    cardOverview: ItemOverview,
    rewardOverview: CurrencyItem,
    card: CurrencyCard,
  ): boolean {
    const cardCount = cardOverview.count ?? 0;
    if (cardCount < this.MIN_TRUST_COUNT) return false;

    // Chaos Orb is baseline - always trusted
    if (card.reward === 'Chaos Orb') return true;

    const receiveCount = rewardOverview.receive?.count ?? 0;
    return receiveCount >= this.MIN_TRUST_COUNT;
  }

  private static buildItemCardRow(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview,
  ): FlipTableRowDto | null {
    const rewardChaosValue = rewardOverview.chaosValue;
    const stackSize = cardOverview.stackSize ?? 1;
    const { setChaosPrice, chaosProfit } = ProfitCalculationService.calculateProfitMetrics(
      rewardChaosValue,
      stackSize,
      cardOverview.chaosValue,
    );

    const isGem = rewardOverview.itemClass === 4;
    const rewardText = isGem
      ? `Level ${rewardOverview.gemLevel ?? 0} ${rewardOverview.name}`
      : rewardOverview.name;

    return {
      Card: {
        name: cardOverview.name,
        stack: stackSize,
        chaosPrice: parseInt(String(cardOverview.chaosValue), 10),
        details: {
          artFilename: cardOverview.artFilename ?? '',
          cardName: cardOverview.name,
          cardStack: stackSize,
          rewardName: rewardText,
          rewardClass: rewardOverview.itemClass,
          isCorrupted: !!rewardOverview.corrupted,
          flavour: cardOverview.flavourText ?? '',
        },
      },
      reward: {
        name: rewardText,
        chaosPrice: parseInt(String(rewardChaosValue), 10),
      },
      setChaosPrice,
      chaosProfit,
      isCurrency: false,
    };
  }

  private static buildCurrencyCardRow(
    cardOverview: ItemOverview,
    rewardOverview: CurrencyItem,
    card: CurrencyCard,
  ): FlipTableRowDto | null {
    const rewardChaosEquivalent = card.reward === 'Chaos Orb'
      ? 1
      : rewardOverview.chaosEquivalent;

    if (!rewardChaosEquivalent) return null;

    const rewardChaosValue = rewardChaosEquivalent * card.rewardSpec.amount;
    const stackSize = cardOverview.stackSize ?? 1;
    const { setChaosPrice, chaosProfit } = ProfitCalculationService.calculateProfitMetrics(
      rewardChaosValue,
      stackSize,
      cardOverview.chaosValue,
    );

    const hasMultipleRewards = card.rewardSpec.amount > 1;
    const rewardText = hasMultipleRewards
      ? `${card.rewardSpec.amount}x ${card.reward}`
      : card.reward;

    return {
      Card: {
        name: card.name,
        stack: stackSize,
        chaosPrice: parseInt(String(cardOverview.chaosValue), 10),
        details: {
          artFilename: cardOverview.artFilename ?? '',
          cardName: cardOverview.name,
          cardStack: stackSize,
          rewardName: rewardText,
          rewardClass: '00',
          isCorrupted: false,
          flavour: cardOverview.flavourText ?? '',
        },
      },
      reward: {
        name: rewardText,
        chaosPrice: parseInt(String(rewardChaosValue), 10),
      },
      setChaosPrice,
      chaosProfit,
      isCurrency: true,
    };
  }

  private static calculateProfitMetrics(
    rewardChaosValue: number,
    stackSize: number,
    cardChaosValue: number,
  ): { setChaosPrice: number; chaosProfit: number } {
    const cardSetChaosValue = stackSize * cardChaosValue;
    const chaosProfit = parseInt(String(rewardChaosValue - cardSetChaosValue), 10);

    return {
      setChaosPrice: parseInt(String(cardSetChaosValue), 10),
      chaosProfit,
    };
  }
}

// Singleton instances
const exactItemMatcher = new ExactItemMatcher();
const exactCurrencyMatcher = new ExactCurrencyMatcher();

export const profitCalculationService = new ProfitCalculationService(
  _cardRepository,
  exactItemMatcher,
  exactCurrencyMatcher,
);
