export interface CardCurrencyItem {
  cardName: string;
  rewardName: string;
  amount: number;
}

const CURRENCY_CARDS: CardCurrencyItem[] = [
  {
    amount: 10,
    cardName: 'The Wrath',
    rewardName: 'Chaos Orb',
  },
  {
    amount: 3,
    cardName: 'Abandoned Wealth',
    rewardName: 'Exalted Orb',
  },
  {
    amount: 2,
    cardName: "The Saint's Treasure",
    rewardName: 'Exalted Orb',
  },
  {
    amount: 1,
    cardName: 'The Hoarder',
    rewardName: 'Exalted Orb',
  },
  {
    amount: 10,
    cardName: 'The Sephirot',
    rewardName: 'Divine Orb',
  },
  {
    amount: 1,
    cardName: 'House of Mirrors',
    rewardName: 'Mirror of Kalandra',
  },
  {
    amount: 1,
    cardName: 'Seven Years Bad Luck',
    rewardName: 'Mirror Shard',
  },
  {
    amount: 19,
    cardName: 'Unrequited Love',
    rewardName: 'Mirror Shard',
  },
  {
    amount: 5,
    cardName: "Brother's Stash",
    rewardName: 'Exalted Orb',
  },
  {
    amount: 7,
    cardName: 'The Scout',
    rewardName: 'Exalted Orb',
  },
  {
    amount: 10,
    cardName: 'Underground Forest',
    rewardName: 'Awakened Sextant',
  },
  {
    amount: 10,
    cardName: 'Alluring Bounty',
    rewardName: 'Exalted Orb',
  },
];

export default CURRENCY_CARDS;
