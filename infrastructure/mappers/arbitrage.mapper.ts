import { CardArbitrage } from '@domain/aggregates/card-arbitrage.aggregate';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';

/**
 * Maps domain arbitrage aggregates to infrastructure DTOs
 * Enforces architectural boundary: domain models stay in domain layer
 */
export class ArbitrageMapper {
  static toDto(arbitrage: CardArbitrage): ProfitTableRowDto {
    const { card, market, profit } = arbitrage;
    const { cardPrice, rewardPrice } = market;

    return {
      card: {
        name: card.name,
        stack: cardPrice.stackSize ?? 1,
        chaosPrice: Math.floor(cardPrice.chaosValue),
        details: {
          artFilename: cardPrice.artFilename ?? '',
          cardName: card.name,
          cardStack: cardPrice.stackSize ?? 1,
          rewardName: arbitrage.getRewardDisplayName(),
          rewardClass: 'itemClass' in rewardPrice ? rewardPrice.itemClass : '00',
          isCorrupted: 'corrupted' in rewardPrice ? (rewardPrice.corrupted ?? false) : false,
          flavour: cardPrice.flavourText ?? '',
        },
      },
      reward: {
        name: arbitrage.getRewardDisplayName(),
        chaosPrice: profit.rewardChaosValue,
      },
      setChaosPrice: profit.setChaosPrice,
      chaosProfit: profit.chaosProfitValue,
      isCurrency: card.isCurrencyCard(),
    };
  }
}
