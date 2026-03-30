const CurrencyCards = require('../config/currency-cards');
const Cards = require('../config/cards');

const { findCardOverview, GetLeagueExaltedValue, ChaosToExalted } = require('./utils');

// return false means the item will be ignored.
async function GenerateTableCardRowJson(Data = {}, CardDetails = {}) {
  const LeagueDataResult = await findCardOverview(Data, CardDetails, false);

  if (!LeagueDataResult) return false;

  const LeagueExaltedValue = await GetLeagueExaltedValue(Data);

  const CardData = LeagueDataResult.CardOverview;
  const RewardData = LeagueDataResult.RewardOverview;

  if (!CardData || !RewardData) return false;

  // 'Trust' System
  if ((CardData?.count ?? 0) < 10 || (RewardData?.count ?? 0) < 10) return false;

  const Card = {
    ExaltedPrice: CardData?.exaltedValue ?? ChaosToExalted(LeagueExaltedValue, CardData.chaosValue),
  };

  const Reward = {
    ChaosValue: RewardData.chaosValue,
  };

  // eslint-disable-next-line max-len
  Reward.ExaltedValue = RewardData?.exaltedValue ?? ChaosToExalted(LeagueExaltedValue, Reward.ChaosValue);

  const CardSet = {
    ChaosValue: CardData.stackSize * CardData.chaosValue,
  };

  if (CardData.exaltedValue) CardSet.ExaltedValue = Card.ExaltedPrice * CardData.stackSize;
  else CardSet.ExaltedValue = ChaosToExalted(LeagueExaltedValue, CardSet.ChaosValue);

  CardSet.ExaltedValue = parseFloat(CardSet.ExaltedValue);

  const ChaosProfit = parseInt(RewardData.chaosValue - CardSet.ChaosValue, 10);

  const RewardText = RewardData.itemClass === 4 ? `Level ${RewardData.gemLevel} ${RewardData.name}` : RewardData.name;

  const Details = {
    artFilename: CardData.artFilename,
    CardName: CardData.name,
    CardStack: CardData.stackSize,
    RewardName: RewardText,
    rewardClass: RewardData.itemClass,
    isCorrupted: !!RewardData.corrupted,
    Flavour: CardData.flavourText,
  };

  const Result = {
    Card: {
      name: CardData.name,
      stack: CardData.stackSize,
      chaosprice: parseInt(CardData.chaosValue, 10),
      exaltedprice: parseFloat(Card.ExaltedPrice.toFixed(2)),
      Details,
    },
    Reward: {
      name: RewardText,
      chaosprice: parseInt(Reward.ChaosValue, 10),
      exaltedprice: parseFloat(Reward.ExaltedValue.toFixed(2)),
    },
    setchaosprice: parseInt(CardSet.ChaosValue, 10),
    setexprice: parseFloat(CardSet.ExaltedValue.toFixed(2)),
    chaosprofit: ChaosProfit,
    isCurrency: false,
  };

  if (Result.chaosprofit > 0) return Result;
  return false;
}

// return false means the item will be ignored.
async function GenerateTableCurrencyCardsRowJson(Data = {}, CardDetails = {}) {
  const LeagueDataResult = await findCardOverview(Data, CardDetails, true);

  if (!LeagueDataResult) return false;

  const LeagueExaltedValue = await GetLeagueExaltedValue(Data);

  const CardData = LeagueDataResult.CardOverview;
  if (!CardData) return false;

  const RewardData = LeagueDataResult.RewardOverview;

  const RewardChaosEquivalentValue = CardDetails.Reward === 'Chaos Orb' ? 1 : RewardData.chaosEquivalent;
  if (!RewardChaosEquivalentValue) return false;

  // 'Trust' System
  if (CardData.count < 10) return false;
  if (CardDetails.Reward !== 'Chaos Orb') {
    try {
      const { count = 0 } = RewardData.receive;
      if (count < 10) return false;
    } catch {
      return false;
    }
  }

  const Card = {
    ExaltedPrice: CardData?.exaltedValue ?? ChaosToExalted(LeagueExaltedValue, CardData.chaosValue),
  };

  const Reward = {
    ChaosValue: RewardChaosEquivalentValue * CardDetails.Amount,
  };

  Reward.ExaltedValue = ChaosToExalted(LeagueExaltedValue, Reward.ChaosValue);

  const CardSet = {
    ChaosValue: CardData.stackSize * CardData.chaosValue,
  };

  if (CardData.exaltedValue) CardSet.ExaltedValue = Card.ExaltedPrice * CardData.stackSize;
  else CardSet.ExaltedValue = ChaosToExalted(LeagueExaltedValue, CardSet.ChaosValue);

  CardSet.ExaltedValue = parseFloat(CardSet.ExaltedValue);

  const ChaosProfit = parseInt(Reward.ChaosValue - CardSet.ChaosValue, 10);

  const RewardText = CardDetails.Amount > 1 ? `${CardDetails.Amount}x ${CardDetails.Reward}` : CardDetails.Reward;

  const Details = {
    artFilename: CardData.artFilename,
    CardName: CardData.name,
    CardStack: CardData.stackSize,
    RewardName: RewardText,
    rewardClass: '00',
    isCorrupted: false,
    Flavour: CardData.flavourText,
  };

  const Result = {
    Card: {
      name: CardDetails.Name,
      stack: CardData.stackSize,
      chaosprice: parseInt(CardData.chaosValue, 10),
      exaltedprice: parseFloat(Card.ExaltedPrice.toFixed(2)),
      Details,
    },
    Reward: {
      name: Details.RewardName,
      chaosprice: parseInt(Reward.ChaosValue, 10),
      exaltedprice: parseFloat(Reward.ExaltedValue.toFixed(2)),
    },
    setchaosprice: parseInt(CardSet.ChaosValue, 10),
    setexprice: parseFloat(CardSet.ExaltedValue.toFixed(2)),
    chaosprofit: ChaosProfit,
    isCurrency: true,
  };

  if (Result.chaosprofit > 0) return Result;
  return false;
}

async function GenerateFlipTableArray(Data = {}) {
  const TableArray = [];

  {
    const Workload = [];
    // Cards
    for (let i = 0; i < Cards.length; i += 1) {
      const Details = Cards[i];

      const Work = () => new Promise((resolve) => {
        GenerateTableCardRowJson(Data, Details)
          .then((Result) => {
            if (Result) TableArray.push(Result);
            resolve();
          });
      });

      Workload.push(Work());
    }

    // Currency Cards
    for (let i = 0; i < CurrencyCards.length; i += 1) {
      const Details = CurrencyCards[i];

      const Work = () => new Promise((resolve) => {
        GenerateTableCurrencyCardsRowJson(Data, Details)
          .then((Result) => {
            if (Result) TableArray.push(Result);
            resolve();
          });
      });

      Workload.push(Work());
    }

    await Promise.all(Workload);
  }

  return TableArray;
}

/* async function GenerateFlipTable(Data = {}) {
  let TableArray = await GenerateFlipTableArray(Data);

  TableArray = TableArray.sort((a, b) => {
    const v1 = a.chaosprofit;
    const v2 = b.chaosprofit;
    return v2 - v1;
  });

  return TableArray;
} */

module.exports = {
  FlipTable: GenerateFlipTableArray,
};
