import { DivinationCard } from '@domain/entities/card.entity';
import { ItemOverview } from '@domain/value-objects/item-overview';
import { CurrencyItem } from '@domain/value-objects/currency-item';
import { ArbitrageOpportunity } from '@domain/aggregates/arbitrage-opportunity';

export interface LeagueData {
  league: string;
  items: ItemOverview[];
  currency: CurrencyItem[];
}

export interface IArbitrageEvaluator {
  evaluateCardArbitrage(leagueData: LeagueData, card: DivinationCard): ArbitrageOpportunity | null;
  findAllArbitrageOpportunities(
    leagueData: LeagueData,
    cards: DivinationCard[],
  ): ArbitrageOpportunity[];
}
