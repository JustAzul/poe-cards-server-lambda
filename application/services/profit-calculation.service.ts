import {
  IProfitCalculationService,
  ICardMatcher,
} from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto } from '@application/dtos/flip-table.dto';
import { FlipTableRowDto } from '@infrastructure/dtos/flip-table.dto';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';
import { ICurrencyCardRepository } from '@domain/repositories/interfaces/currency-card.repository.interface';

// Default instance with concrete dependencies
import { cardRepository as _cardRepository } from '@infrastructure/repositories/card.repository';
import { currencyCardRepository as _currencyCardRepository } from '@infrastructure/repositories/currency-card.repository';
import { exactItemMatcher, exactCurrencyMatcher } from '@application/services/matchers';

export class ProfitCalculationService implements IProfitCalculationService {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly currencyCardRepository: ICurrencyCardRepository,
    private readonly itemMatcher: ICardMatcher,
    private readonly currencyMatcher: ICardMatcher,
  ) {}

  /**
   * Calculate profit for a single card
   */
  calculateCardProfit(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
    isCurrency: boolean,
  ): FlipTableRowDto | null {
    const matcher = isCurrency ? this.currencyMatcher : this.itemMatcher;
    const cardOverview = matcher.matchCard(leagueData, cardDetails.Name);
    const rewardOverview = matcher.matchReward(leagueData, cardDetails);

    if (!cardOverview || !rewardOverview) {
      return null;
    }

    // Trust system: require minimum trade counts
    if (!this.meetsMinimumTrust(cardOverview, rewardOverview, cardDetails, isCurrency)) {
      return null;
    }

    return isCurrency
      ? ProfitCalculationService.buildCurrencyCardRow(
        cardOverview,
        rewardOverview as CurrencyItem,
        cardDetails,
      )
      : ProfitCalculationService.buildItemCardRow(cardOverview, rewardOverview as ItemOverview);
  }

  /**
   * Generate complete flip table for all cards
   */
  generateFlipTable(
    leagueData: Array<ItemOverview | CurrencyItem>,
  ): FlipTableRowDto[] {
    const regularCards = this.processCardsBatch(
      this.cardRepository.getAllCards(),
      leagueData,
      false,
    );

    const currencyCards = this.processCardsBatch(
      this.currencyCardRepository.getAllCurrencyCards(),
      leagueData,
      true,
    );

    return [...regularCards, ...currencyCards];
  }

  private processCardsBatch(
    cards: CardDetailsDto[],
    leagueData: Array<ItemOverview | CurrencyItem>,
    isCurrency: boolean,
  ): FlipTableRowDto[] {
    return cards
      .map((cardDetails) => this.calculateCardProfit(leagueData, cardDetails, isCurrency))
      .filter((result): result is FlipTableRowDto => result !== null && result.chaosProfit > 0);
  }

  private meetsMinimumTrust(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
    cardDetails: CardDetailsDto,
    isCurrency: boolean,
  ): boolean {
    if (!this.hasMinimumCardCount(cardOverview)) {
      return false;
    }

    return this.hasMinimumRewardCount(rewardOverview, isCurrency, cardDetails.Reward === 'Chaos Orb');
  }

  private hasMinimumCardCount(cardOverview: ItemOverview): boolean {
    const cardCount = cardOverview.count ?? 0;
    return cardCount >= this.MIN_TRUST_COUNT;
  }

  private hasMinimumRewardCount(
    rewardOverview: ItemOverview | CurrencyItem,
    isCurrency: boolean,
    isChaoOrb: boolean,
  ): boolean {
    if (isCurrency && !isChaoOrb) {
      const currencyReward = rewardOverview as CurrencyItem;
      const receiveCount = currencyReward.receive?.count ?? 0;
      return receiveCount >= this.MIN_TRUST_COUNT;
    }

    if (!isCurrency) {
      const itemReward = rewardOverview as ItemOverview;
      const rewardCount = itemReward.count ?? 0;
      return rewardCount >= this.MIN_TRUST_COUNT;
    }

    return true;
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
    cardDetails: CardDetailsDto,
  ): FlipTableRowDto | null {
    const rewardChaosEquivalent = cardDetails.Reward === 'Chaos Orb'
      ? 1
      : rewardOverview.chaosEquivalent;

    if (!rewardChaosEquivalent) return null;

    const rewardChaosValue = rewardChaosEquivalent * (cardDetails.Amount ?? 1);
    const stackSize = cardOverview.stackSize ?? 1;
    const { setChaosPrice, chaosProfit } = ProfitCalculationService.calculateProfitMetrics(
      rewardChaosValue,
      stackSize,
      cardOverview.chaosValue,
    );

    const hasMultipleRewards = (cardDetails.Amount ?? 1) > 1;
    const rewardText = hasMultipleRewards
      ? `${cardDetails.Amount}x ${cardDetails.Reward}`
      : cardDetails.Reward;

    return {
      Card: {
        name: cardDetails.Name,
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

export const profitCalculationService = new ProfitCalculationService(
  _cardRepository,
  _currencyCardRepository,
  exactItemMatcher,
  exactCurrencyMatcher,
);
