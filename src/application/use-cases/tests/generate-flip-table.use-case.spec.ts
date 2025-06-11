import GenerateFlipTableUseCase, {
  CardRowInput,
  CurrencyCardRowInput,
} from '../generate-flip-table.use-case';

describe(GenerateFlipTableUseCase.name, () => {
  it('should compute profits for card rows', () => {
    const cards: CardRowInput[] = [
      {
        cardPriceChaos: 2,
        name: 'The Scholar',
        rewardChaos: 15,
        setSize: 4,
      },
    ];

    const [row] = GenerateFlipTableUseCase.execute({
      cards,
      exaltedPriceChaos: 200,
    });

    expect(row).toMatchObject({
      chaosProfit: 7,
      costChaos: 8,
      exaltProfit: 7 / 200,
      name: 'The Scholar',
      resultChaos: 15,
      setSize: 4,
    });
  });

  it('should merge and sort all rows by chaos profit', () => {
    const cards: CardRowInput[] = [
      { cardPriceChaos: 5, name: 'Card A', rewardChaos: 20, setSize: 2 },
      { cardPriceChaos: 1, name: 'Card B', rewardChaos: 6, setSize: 3 },
    ];
    const currencyCards: CurrencyCardRowInput[] = [
      {
        cardPriceChaos: 0.5,
        currencyChaos: 20,
        name: 'Currency A',
        setSize: 10,
      },
    ];

    const rows = GenerateFlipTableUseCase.execute({
      cards,
      currencyCards,
      exaltedPriceChaos: 200,
    });

    const chaosProfits = rows.map((r) => r.chaosProfit);
    const sorted = [...chaosProfits].sort((a, b) => b - a);

    expect(chaosProfits).toEqual(sorted);
    expect(rows.length).toBe(3);
  });
});
