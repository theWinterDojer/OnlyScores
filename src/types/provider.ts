import { GameStatus } from "./score";

export type ProviderLeague = {
  id: string;
  name: string;
  sport: string;
};

export type ProviderTeam = {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  logoUrl?: string;
};

export type ProviderGame = {
  id: string;
  leagueId: string;
  startTime: string; // ISO timestamp
  status: GameStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  lastUpdated: string; // ISO timestamp
};

export type ProviderScoreCard = {
  id: string;
  leagueId: string;
  title: string;
  games: ProviderGame[];
};

export type ProviderLeaguesResponse = {
  leagues: ProviderLeague[];
};

export type ProviderTeamsResponse = {
  teams: ProviderTeam[];
};

export type ProviderScoresResponse = {
  cards: ProviderScoreCard[];
  fetchedAt: string; // ISO timestamp
};
