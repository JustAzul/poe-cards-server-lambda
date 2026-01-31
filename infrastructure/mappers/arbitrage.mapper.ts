import { Arbitrage } from '@domain/models/arbitrage';
import { ProfitTableRowDto } from '@infrastructure/dtos/profit-table.dto';

/**
 * Maps domain arbitrage opportunities to infrastructure DTOs
 * Enforces architectural boundary: domain models stay in domain layer
 */
export class ArbitrageMapper {
  static toDto(domainResult: Arbitrage): ProfitTableRowDto {
    return {
      card: {
        name: domainResult.cardName,
        stack: domainResult.cardStack,
        chaosPrice: domainResult.cardChaosPrice,
        details: {
          artFilename: domainResult.cardArtFilename,
          cardName: domainResult.cardName,
          cardStack: domainResult.cardStack,
          rewardName: domainResult.rewardName,
          rewardClass: domainResult.rewardClass,
          isCorrupted: domainResult.isCorrupted,
          flavour: domainResult.cardFlavourText,
        },
      },
      reward: {
        name: domainResult.rewardName,
        chaosPrice: domainResult.rewardChaosPrice,
      },
      setChaosPrice: domainResult.setChaosPrice,
      chaosProfit: domainResult.chaosProfit,
      isCurrency: domainResult.isCurrency,
    };
  }
}
