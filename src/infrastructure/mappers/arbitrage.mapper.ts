import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';
import { ItemClass } from '@domain/value-objects/item-class.enum';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { RewardType } from '@domain/value-objects/reward-spec';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table-row.dto';

/**
 * Maps domain arbitrage aggregates to infrastructure DTOs
 * Enforces architectural boundary: domain models stay in domain layer
 */
export class ArbitrageMapper {
  static toDto(arbitrage: ArbitrageOpportunity): ProfitTableRowDto {
    const { card, market, profit } = arbitrage;
    const { cardPrice, rewardPrice } = market;

    const rewardDisplayName = ArbitrageMapper.getRewardDisplayName(arbitrage);

    return {
      card: {
        name: card.name,
        stack: cardPrice.stackSize ?? 1,
        chaosPrice: cardPrice.chaosValue,
        details: {
          artFilename: cardPrice.artFilename ?? '',
          rewardName: rewardDisplayName,
          rewardClass: rewardPrice instanceof ItemOverview ? rewardPrice.itemClass : null,
          isCorrupted: rewardPrice instanceof ItemOverview
            ? (rewardPrice.corrupted ?? false)
            : false,
          flavour: cardPrice.flavourText ?? '',
        },
      },
      reward: {
        name: rewardDisplayName,
        chaosPrice: profit.rewardChaosValue,
      },
      setChaosPrice: profit.setChaosPrice,
      chaosProfit: profit.chaosProfitValue,
      isCurrency: card.isCurrencyCard(),
    };
  }

  /**
   * Get formatted reward display name for presentation
   * Handles special formatting for multiple currency amounts and gem levels
   */
  private static getRewardDisplayName(arbitrage: ArbitrageOpportunity): string {
    const { card, market } = arbitrage;

    if (card.rewardSpec.type === RewardType.CURRENCY) {
      return card.rewardSpec.amount > 1
        ? `${card.rewardSpec.amount}x ${card.reward}`
        : card.reward;
    }

    const { rewardPrice } = market;
    if (rewardPrice instanceof ItemOverview && rewardPrice.itemClass === ItemClass.SKILL_GEM) {
      return `Level ${rewardPrice.gemLevel ?? 0} ${rewardPrice.name}`;
    }

    return card.reward;
  }
}
