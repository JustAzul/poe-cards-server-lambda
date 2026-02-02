// Path of Exile Official API - League Response
export interface LeagueApiResponse {
  id: string;
  name: string;
  realm: string;
  url: string;
  startAt: string | null;
  endAt: string | null;
  description: string;
  category: {
    id: string;
  };
  registerAt?: string;
  delveEvent: boolean;
  rules: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}
