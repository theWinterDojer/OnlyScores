export type GameStatus = 'scheduled' | 'live' | 'final';

export type Game = {
  id: string;
  startTime?: string;
  time: string; // e.g., "7:30 PM"
  awayTeam: string;
  homeTeam: string;
  awayLogoUrl?: string;
  homeLogoUrl?: string;
  awayScore?: number;
  homeScore?: number;
  status: GameStatus;
};

export type ScoreCard = {
  id: string;
  title: string; // e.g., "NBA"
  games: Game[];
  lastUpdated?: string;
};
