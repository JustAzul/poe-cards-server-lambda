import GenerateFlipTableUseCase, {
  CardRowInput,
  CurrencyCardRowInput,
} from '../generate-flip-table.use-case';

describe(GenerateFlipTableUseCase.name, () => {
  it('should compute profits for card rows', () => {
    const cards: CardRowInput[] = [
      {
        name: 'The Scholar',
        setSize: 4,
        cardPriceChaos: 2,
        rewardChaos: 15,
      },
    ];

    const useCase = new GenerateFlipTableUseCase({
      cards,
      exaltedPriceChaos: 200,
    });

    const [row] = useCase.execute();

    expect(row).toMatchObject({
      name: 'The Scholar',
      setSize: 4,
      costChaos: 8,
      resultChaos: 15,
      chaosProfit: 7,
      exaltProfit: 7 / 200,
    });
  });

  it('should merge and sort all rows by chaos profit', () => {
    const cards: CardRowInput[] = [
      { name: 'Card A', setSize: 2, cardPriceChaos: 5, rewardChaos: 20 },
      { name: 'Card B', setSize: 3, cardPriceChaos: 1, rewardChaos: 6 },
    ];
    const currencyCards: CurrencyCardRowInput[] = [
      { name: 'Currency A', setSize: 10, cardPriceChaos: 0.5, currencyChaos: 20 },
    ];

    const useCase = new GenerateFlipTableUseCase({
      cards,
      currencyCards,
      exaltedPriceChaos: 200,
    });

    const rows = useCase.execute();

    const chaosProfits = rows.map((r) => r.chaosProfit);
    const sorted = [...chaosProfits].sort((a, b) => b - a);

    expect(chaosProfits).toEqual(sorted);
    expect(rows.length).toBe(3);
  });
});
