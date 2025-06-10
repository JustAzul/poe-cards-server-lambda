
export interface CardRowInput {
  readonly name: string;
  readonly setSize: number;
  readonly cardPriceChaos: number;
  readonly rewardChaos: number;
}

export interface CurrencyCardRowInput {
  readonly name: string;
  readonly setSize: number;
  readonly cardPriceChaos: number;
  readonly currencyChaos: number;
}

export interface FlipTableRow {
  readonly name: string;
  readonly setSize: number;
  readonly costChaos: number;
  readonly resultChaos: number;
  readonly chaosProfit: number;
  readonly exaltProfit: number;
}

export interface GenerateFlipTableProps {
  readonly cards: CardRowInput[];
  readonly currencyCards?: CurrencyCardRowInput[];
  readonly exaltedPriceChaos: number;
}

export default class GenerateFlipTableUseCase {
  private readonly props: GenerateFlipTableProps;

  constructor(props: GenerateFlipTableProps) {
    this.props = props;
  }

  execute(): FlipTableRow[] {
    const { cards, currencyCards = [], exaltedPriceChaos } = this.props;
    const cardRows = cards.map((card) =>
      this.buildCardRow(card, exaltedPriceChaos),
    );
    const currencyRows = currencyCards.map((card) =>
      this.buildCurrencyRow(card, exaltedPriceChaos),
    );

    return [...cardRows, ...currencyRows].sort(
      (a, b) => b.chaosProfit - a.chaosProfit,
    );
  }

  private buildCardRow(card: CardRowInput, exaltedPrice: number): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.rewardChaos - cost;
    return {
      name: card.name,
      setSize: card.setSize,
      costChaos: cost,
      resultChaos: card.rewardChaos,
      chaosProfit: profitChaos,
      exaltProfit: profitChaos / exaltedPrice,
    };
  }

  private buildCurrencyRow(card: CurrencyCardRowInput, exaltedPrice: number): FlipTableRow {
    const cost = card.cardPriceChaos * card.setSize;
    const profitChaos = card.currencyChaos - cost;
    return {
      name: card.name,
      setSize: card.setSize,
      costChaos: cost,
      resultChaos: card.currencyChaos,
      chaosProfit: profitChaos,
      exaltProfit: profitChaos / exaltedPrice,
    };
  }
}
