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
  readonly exaltProfit: number;
  readonly name: string;
  readonly resultChaos: number;
  readonly setSize: number;
}

export interface GenerateFlipTableProps {
  readonly cards: CardRowInput[];
  readonly currencyCards?: CurrencyCardRowInput[];
  readonly exaltedPriceChaos: number;
}

export default class GenerateFlipTableUseCase {
  static execute(props: GenerateFlipTableProps): FlipTableRow[] {
    const { cards, currencyCards = [], exaltedPriceChaos } = props;
    const cardRows = cards.map((card) =>
      GenerateFlipTableUseCase.buildCardRow(card, exaltedPriceChaos),
    );
    const currencyRows = currencyCards.map((card) =>
      GenerateFlipTableUseCase.buildCurrencyRow(card, exaltedPriceChaos),
    );

    return [...cardRows, ...currencyRows].sort(
      (a, b) => b.chaosProfit - a.chaosProfit,
    );
  }

  private static buildCardRow(
    card: CardRowInput,
    exaltedPrice: number,
  ): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.rewardChaos - cost;
    return {
      chaosProfit: profitChaos,
      costChaos: cost,
      exaltProfit: profitChaos / exaltedPrice,
      name: card.name,
      resultChaos: card.rewardChaos,
      setSize: card.setSize,
    };
  }

  private static buildCurrencyRow(
    card: CurrencyCardRowInput,
    exaltedPrice: number,
  ): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.currencyChaos - cost;
    return {
      chaosProfit: profitChaos,
      costChaos: cost,
      exaltProfit: profitChaos / exaltedPrice,
      name: card.name,
      resultChaos: card.currencyChaos,
      setSize: card.setSize,
    };
  }
}
