import GenerateFlipTableUseCase, {
  CardRowInput,
  CurrencyCardRowInput,
} from 'application/use-cases/generate-flip-table.use-case';

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
    });

    expect(row).toMatchObject({
      chaosProfit: 7,
      costChaos: 8,
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
    });

    const chaosProfits = rows.map((r) => r.chaosProfit);
    const sorted = [...chaosProfits].sort((a, b) => b - a);

    expect(chaosProfits).toEqual(sorted);
    expect(rows.length).toBe(3);
  });

  it('should handle zero profit flips by excluding them', () => {
    const cards: CardRowInput[] = [
      { cardPriceChaos: 5, name: 'Card A', rewardChaos: 10, setSize: 2 }, // profit = 0
    ];
    const rows = GenerateFlipTableUseCase.execute({
      cards,
    });
    expect(rows.length).toBe(0);
  });

  it('should handle negative profit flips by excluding them', () => {
    const cards: CardRowInput[] = [
      { cardPriceChaos: 6, name: 'Card A', rewardChaos: 10, setSize: 2 }, // profit = -2
    ];
    const rows = GenerateFlipTableUseCase.execute({
      cards,
    });
    expect(rows.length).toBe(0);
  });

  it('should return empty array when no cards provided', () => {
    const rows = GenerateFlipTableUseCase.execute({
      cards: [],
    });
    expect(rows.length).toBe(0);
  });
});
