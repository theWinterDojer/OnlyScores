import { Provider, ProviderFetchOptions, ProviderScoresRequest } from "./Provider";
import {
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard,
} from "../types/provider";

const API_BASE = "https://www.thesportsdb.com/api/v1/json";
const DEFAULT_API_KEY = "1";

const getApiKey = () =>
  process.env.EXPO_PUBLIC_THESPORTSDB_API_KEY ?? DEFAULT_API_KEY;

const buildUrl = (path: string) => `${API_BASE}/${getApiKey()}/${path}`;

const fetchJson = async <T>(
  path: string,
  options?: ProviderFetchOptions
): Promise<T> => {
  const response = await fetch(buildUrl(path), { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`TheSportsDB request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const theSportsDbProvider: Provider<
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard
> = {
  id: "thesportsdb",
  name: "TheSportsDB",
  async getLeagues(options?: ProviderFetchOptions) {
    void options;
    return [];
  },
  async getTeams(leagueId: string, options?: ProviderFetchOptions) {
    void leagueId;
    void options;
    return [];
  },
  async getScores(request: ProviderScoresRequest, options?: ProviderFetchOptions) {
    void request;
    void options;
    return [];
  },
};

export { fetchJson };
export default theSportsDbProvider;
