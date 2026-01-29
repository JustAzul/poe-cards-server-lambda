import {
  IProfitCalculationService,
  IPriceConversionService,
  ICardMatchingService,
} from '@application/interfaces/services.interface';
import { ItemOverview } from '@domain/entities/item-overview.entity';
import { CurrencyItem } from '@domain/entities/currency-item.entity';
import { CardDetailsDto, FlipTableRowDto } from '@application/dtos/flip-table.dto';
import { ICardRepository } from '@domain/repositories/interfaces/card.repository.interface';
import { ICurrencyCardRepository } from '@domain/repositories/interfaces/currency-card.repository.interface';

// Default implementations
import { cardRepository as defaultCardRepository } from '@infrastructure/repositories/card.repository';
import { currencyCardRepository as defaultCurrencyCardRepository } from '@infrastructure/repositories/currency-card.repository';
import { priceConversionService as defaultPriceConversionService } from '@application/services/price-conversion.service';
import { cardMatchingService as defaultCardMatchingService } from '@application/services/card-matching.service';

export class ProfitCalculationService implements IProfitCalculationService {
  private readonly MIN_TRUST_COUNT = 10;

  constructor(
    private readonly cardRepository: ICardRepository = defaultCardRepository,
    private readonly currencyCardRepository: ICurrencyCardRepository = defaultCurrencyCardRepository,
    private readonly priceConversionService: IPriceConversionService = defaultPriceConversionService,
    private readonly cardMatchingService: ICardMatchingService = defaultCardMatchingService,
  ) {}

  /**
   * Calculate profit for a single card
   */
  calculateCardProfit(
    leagueData: Array<ItemOverview | CurrencyItem>,
    cardDetails: CardDetailsDto,
    isCurrency: boolean
  ): FlipTableRowDto | null {
    const matchResult = this.cardMatchingService.findCardMatch(leagueData, cardDetails, isCurrency);

    if (!matchResult.isValid || !matchResult.cardOverview || !matchResult.rewardOverview) {
      return null;
    }

    // Trust system: require minimum trade counts
    if (!this.meetsMinimumTrust(matchResult.cardOverview, matchResult.rewardOverview, cardDetails, isCurrency)) {
      return null;
    }

    const exaltedValue = this.priceConversionService.getExaltedValue(leagueData);

    return isCurrency
      ? this.buildCurrencyCardRow(matchResult.cardOverview, matchResult.rewardOverview as CurrencyItem, cardDetails, exaltedValue)
      : this.buildItemCardRow(matchResult.cardOverview, matchResult.rewardOverview as ItemOverview, cardDetails, exaltedValue);
  }

  /**
   * Generate complete flip table for all cards
   */
  generateFlipTable(
    leagueData: Array<ItemOverview | CurrencyItem>
  ): FlipTableRowDto[] {
    const results: FlipTableRowDto[] = [];

    // Process regular cards
    const cards = this.cardRepository.getAllCards();
    cards.forEach(cardDetails => {
      const result = this.calculateCardProfit(leagueData, cardDetails, false);
      if (result !== null && result.chaosprofit > 0) {
        results.push(result);
      }
    });

    // Process currency cards
    const currencyCards = this.currencyCardRepository.getAllCurrencyCards();
    currencyCards.forEach(cardDetails => {
      const result = this.calculateCardProfit(leagueData, cardDetails, true);
      if (result !== null && result.chaosprofit > 0) {
        results.push(result);
      }
    });

    return results;
  }

  private meetsMinimumTrust(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview | CurrencyItem,
    cardDetails: CardDetailsDto,
    isCurrency: boolean
  ): boolean {
    const cardCount = cardOverview.count ?? 0;
    if (cardCount < this.MIN_TRUST_COUNT) return false;

    if (isCurrency && cardDetails.Reward !== 'Chaos Orb') {
      const currencyReward = rewardOverview as CurrencyItem;
      const receiveCount = currencyReward.receive?.count ?? 0;
      if (receiveCount < this.MIN_TRUST_COUNT) return false;
    } else if (!isCurrency) {
      const itemReward = rewardOverview as ItemOverview;
      const rewardCount = itemReward.count ?? 0;
      if (rewardCount < this.MIN_TRUST_COUNT) return false;
    }

    return true;
  }

  private buildItemCardRow(
    cardOverview: ItemOverview,
    rewardOverview: ItemOverview,
    cardDetails: CardDetailsDto,
    exaltedValue: number
  ): FlipTableRowDto | null {
    const cardExaltedPrice = cardOverview.exaltedValue ??
      this.priceConversionService.convertChaosToExalted(cardOverview.chaosValue, exaltedValue);

    const rewardChaosValue = rewardOverview.chaosValue;
    const rewardExaltedValue = rewardOverview.exaltedValue ??
      this.priceConversionService.convertChaosToExalted(rewardChaosValue, exaltedValue);

    const stackSize = cardOverview.stackSize ?? 1;
    const cardSetChaosValue = stackSize * cardOverview.chaosValue;
    const cardSetExaltedValue = cardOverview.exaltedValue
      ? cardExaltedPrice * stackSize
      : this.priceConversionService.convertChaosToExalted(cardSetChaosValue, exaltedValue);

    const chaosProfit = parseInt(String(rewardChaosValue - cardSetChaosValue), 10);

    const rewardText = rewardOverview.itemClass === 4
      ? `Level ${rewardOverview.gemLevel ?? 0} ${rewardOverview.name}`
      : rewardOverview.name;

    return {
      Card: {
        name: cardOverview.name,
        stack: stackSize,
        chaosprice: parseInt(String(cardOverview.chaosValue), 10),
        exaltedprice: parseFloat(cardExaltedPrice.toFixed(2)),
        Details: {
          artFilename: cardOverview.artFilename ?? '',
          CardName: cardOverview.name,
          CardStack: stackSize,
          RewardName: rewardText,
          rewardClass: rewardOverview.itemClass,
          isCorrupted: !!rewardOverview.corrupted,
          Flavour: cardOverview.flavourText ?? '',
        },
      },
      Reward: {
        name: rewardText,
        chaosprice: parseInt(String(rewardChaosValue), 10),
        exaltedprice: parseFloat(rewardExaltedValue.toFixed(2)),
      },
      setchaosprice: parseInt(String(cardSetChaosValue), 10),
      setexprice: parseFloat(cardSetExaltedValue.toFixed(2)),
      chaosprofit: chaosProfit,
      isCurrency: false,
    };
  }

  private buildCurrencyCardRow(
    cardOverview: ItemOverview,
    rewardOverview: CurrencyItem,
    cardDetails: CardDetailsDto,
    exaltedValue: number
  ): FlipTableRowDto | null {
    const rewardChaosEquivalent = cardDetails.Reward === 'Chaos Orb'
      ? 1
      : rewardOverview.chaosEquivalent;

    if (!rewardChaosEquivalent) return null;

    const cardExaltedPrice = cardOverview.exaltedValue ??
      this.priceConversionService.convertChaosToExalted(cardOverview.chaosValue, exaltedValue);

    const rewardChaosValue = rewardChaosEquivalent * (cardDetails.Amount ?? 1);
    const rewardExaltedValue = this.priceConversionService.convertChaosToExalted(rewardChaosValue, exaltedValue);

    const stackSize = cardOverview.stackSize ?? 1;
    const cardSetChaosValue = stackSize * cardOverview.chaosValue;
    const cardSetExaltedValue = cardOverview.exaltedValue
      ? cardExaltedPrice * stackSize
      : this.priceConversionService.convertChaosToExalted(cardSetChaosValue, exaltedValue);

    const chaosProfit = parseInt(String(rewardChaosValue - cardSetChaosValue), 10);

    const rewardText = (cardDetails.Amount ?? 1) > 1
      ? `${cardDetails.Amount}x ${cardDetails.Reward}`
      : cardDetails.Reward;

    return {
      Card: {
        name: cardDetails.Name,
        stack: stackSize,
        chaosprice: parseInt(String(cardOverview.chaosValue), 10),
        exaltedprice: parseFloat(cardExaltedPrice.toFixed(2)),
        Details: {
          artFilename: cardOverview.artFilename ?? '',
          CardName: cardOverview.name,
          CardStack: stackSize,
          RewardName: rewardText,
          rewardClass: '00',
          isCorrupted: false,
          Flavour: cardOverview.flavourText ?? '',
        },
      },
      Reward: {
        name: rewardText,
        chaosprice: parseInt(String(rewardChaosValue), 10),
        exaltedprice: parseFloat(rewardExaltedValue.toFixed(2)),
      },
      setchaosprice: parseInt(String(cardSetChaosValue), 10),
      setexprice: parseFloat(cardSetExaltedValue.toFixed(2)),
      chaosprofit: chaosProfit,
      isCurrency: true,
    };
  }
}

export const profitCalculationService = new ProfitCalculationService();
