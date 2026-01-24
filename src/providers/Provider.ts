export type ProviderFetchOptions = {
  signal?: AbortSignal;
};

export type ProviderScoresRequest = {
  leagueIds?: string[];
  teamIds?: string[];
  date?: string;
  window?: 'day' | 'week';
};

export interface Provider<League = unknown, Team = unknown, ScoreCard = unknown> {
  id: string;
  name: string;
  getLeagues(options?: ProviderFetchOptions): Promise<League[]>;
  getTeams(leagueId: string, options?: ProviderFetchOptions): Promise<Team[]>;
  getScores(request: ProviderScoresRequest, options?: ProviderFetchOptions): Promise<ScoreCard[]>;
}
