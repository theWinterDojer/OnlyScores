import { Provider, ProviderFetchOptions, ProviderScoresRequest } from "./Provider";
import type {
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard,
  ProviderLeaguesResponse,
  ProviderTeamsResponse,
  ProviderScoresResponse,
} from "../types/provider";

const API_BASE = process.env.EXPO_PUBLIC_ONLYSCORES_API_BASE_URL;

const ensureApiBase = () => {
  if (!API_BASE) {
    throw new Error("Missing EXPO_PUBLIC_ONLYSCORES_API_BASE_URL");
  }
  return API_BASE.replace(/\/+$/, "");
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value);
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams(entries);
  return `?${searchParams.toString()}`;
};

const fetchJson = async <T>(
  path: string,
  options?: ProviderFetchOptions
): Promise<T> => {
  const base = ensureApiBase();
  const response = await fetch(`${base}${path}`, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const resolveLeagues = (payload: ProviderLeague[] | ProviderLeaguesResponse) =>
  Array.isArray(payload) ? payload : payload.leagues;

const resolveTeams = (payload: ProviderTeam[] | ProviderTeamsResponse) =>
  Array.isArray(payload) ? payload : payload.teams;

const resolveCards = (payload: ProviderScoreCard[] | ProviderScoresResponse) =>
  Array.isArray(payload) ? payload : payload.cards;

const backendProvider: Provider<
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard
> = {
  id: "backend",
  name: "OnlyScores API",
  async getLeagues(options?: ProviderFetchOptions) {
    const payload = await fetchJson<ProviderLeague[] | ProviderLeaguesResponse>(
      "/v1/leagues",
      options
    );
    return resolveLeagues(payload);
  },
  async getTeams(leagueId: string, options?: ProviderFetchOptions) {
    const query = buildQuery({ leagueId });
    const payload = await fetchJson<ProviderTeam[] | ProviderTeamsResponse>(
      `/v1/teams${query}`,
      options
    );
    return resolveTeams(payload);
  },
  async getScores(request: ProviderScoresRequest, options?: ProviderFetchOptions) {
    const leagueIds = request.leagueIds?.join(",");
    const teamIds = request.teamIds?.join(",");
    const query = buildQuery({
      leagueIds,
      teamIds,
      date: request.date,
      window: request.window,
    });
    const payload = await fetchJson<ProviderScoreCard[] | ProviderScoresResponse>(
      `/v1/scores${query}`,
      options
    );
    return resolveCards(payload);
  },
};

export default backendProvider;
