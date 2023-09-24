type Rule = {
  description: string;
  id: string;
  name: string;
};

export type HttpLeagueResponse = {
  ancestorEvent?: boolean;
  delveEvent: boolean;
  description: string;
  endAt: string | null;
  id: string;
  realm: string;
  registerAt: string;
  rules: Rule[];
  startAt: string | null;
  timedEvent?: boolean;
  url: string;
};
