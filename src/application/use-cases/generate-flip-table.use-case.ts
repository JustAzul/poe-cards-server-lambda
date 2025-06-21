export interface CardRowInput {
  readonly cardPriceChaos: number;
  readonly name: string;
  readonly rewardChaos: number;
  readonly setSize: number;
}

export interface CurrencyCardRowInput {
  readonly cardPriceChaos: number;
  readonly currencyChaos: number;
  readonly name: string;
  readonly setSize: number;
}

export interface FlipTableRow {
  readonly chaosProfit: number;
  readonly costChaos: number;
  readonly name: string;
  readonly resultChaos: number;
  readonly setSize: number;
}

export interface GenerateFlipTableProps {
  readonly cards: CardRowInput[];
  readonly currencyCards?: CurrencyCardRowInput[];
}

export default class GenerateFlipTableUseCase {
  static execute(props: GenerateFlipTableProps): FlipTableRow[] {
    const { cards, currencyCards = [] } = props;
    const cardRows = cards.map((card) =>
      GenerateFlipTableUseCase.buildCardRow(card),
    );
    const currencyRows = currencyCards.map((card) =>
      GenerateFlipTableUseCase.buildCurrencyRow(card),
    );

    const allRows = [...cardRows, ...currencyRows];

    return allRows
      .filter((row) => row.chaosProfit > 0)
      .sort((a, b) => b.chaosProfit - a.chaosProfit);
  }

  private static buildCardRow(card: CardRowInput): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.rewardChaos - cost;
    return {
      chaosProfit: profitChaos,
      costChaos: cost,
      name: card.name,
      resultChaos: card.rewardChaos,
      setSize: card.setSize,
    };
  }

  private static buildCurrencyRow(card: CurrencyCardRowInput): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.currencyChaos - cost;
    return {
      chaosProfit: profitChaos,
      costChaos: cost,
      name: card.name,
      resultChaos: card.currencyChaos,
      setSize: card.setSize,
    };
  }
}
