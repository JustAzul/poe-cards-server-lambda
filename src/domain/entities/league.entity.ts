interface Rule {
  description: string;
  id: string;
  name: string;
}

interface LeagueEntityProps {
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
}

export default class LeagueEntity {
  constructor(private readonly props: LeagueEntityProps) {}
}
