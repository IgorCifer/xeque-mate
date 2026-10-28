export type RankItemDTO = {
  position: number;
  name: string;
  points: number;
};

export type RankingLists = {
  weekly: RankItemDTO[];
  monthly: RankItemDTO[];
  allTime: RankItemDTO[];
};

export type RankingsDTO = RankingLists & {
  weeklyPosition: number | null;
};
