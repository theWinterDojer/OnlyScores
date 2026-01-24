import { Provider, ProviderFetchOptions, ProviderScoresRequest } from "./Provider";
import { backendContract } from "./backendContract";
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
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );
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

const { endpoints } = backendContract;

const backendProvider: Provider<
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard
> = {
  id: "backend",
  name: "OnlyScores API",
  async getLeagues(options?: ProviderFetchOptions) {
    const payload = await fetchJson<ProviderLeaguesResponse>(
      endpoints.leagues,
      options
    );
    return payload.leagues;
  },
  async getTeams(leagueId: string, options?: ProviderFetchOptions) {
    const query = buildQuery({ leagueId });
    const payload = await fetchJson<ProviderTeamsResponse>(
      `${endpoints.teams}${query}`,
      options
    );
    return payload.teams;
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
    const payload = await fetchJson<ProviderScoresResponse>(
      `${endpoints.scores}${query}`,
      options
    );
    return payload.cards;
  },
};

export default backendProvider;
