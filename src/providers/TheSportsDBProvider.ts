import { Provider, ProviderFetchOptions, ProviderScoresRequest } from "./Provider";
import {
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard,
  ProviderGame,
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

type TheSportsDbEventsResponse = {
  events: TheSportsDbEvent[] | null;
};

type TheSportsDbLeaguesResponse = {
  leagues: TheSportsDbLeague[] | null;
};

type TheSportsDbLeague = {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
};

type TheSportsDbTeamsResponse = {
  teams: TheSportsDbTeam[] | null;
};

type TheSportsDbTeam = {
  idTeam?: string;
  idLeague?: string;
  strTeam?: string;
  strTeamShort?: string;
  strTeamAlternate?: string;
  strTeamBadge?: string;
  strTeamLogo?: string;
  strTeamFanart1?: string;
};

type TheSportsDbEvent = {
  idEvent?: string;
  idLeague?: string;
  strLeague?: string;
  dateEvent?: string;
  strTime?: string;
  strTimestamp?: string;
  strStatus?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
};

const trimOrUndefined = (value?: string | null) => value?.trim() || undefined;

const toIsoString = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const parseScore = (value?: string | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseStatus = (value?: string | null, hasScore?: boolean) => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return hasScore ? "live" : "scheduled";
  if (
    normalized.includes("final") ||
    normalized.includes("ft") ||
    normalized.includes("full time") ||
    normalized.includes("ended") ||
    normalized.includes("aet") ||
    normalized.includes("pen")
  ) {
    return "final";
  }
  if (
    normalized.includes("live") ||
    normalized.includes("in play") ||
    normalized.includes("in progress") ||
    normalized.includes("halftime") ||
    normalized.includes("ht") ||
    normalized.includes("1h") ||
    normalized.includes("2h") ||
    normalized.includes("q1") ||
    normalized.includes("q2") ||
    normalized.includes("q3") ||
    normalized.includes("q4") ||
    normalized.includes("ot") ||
    normalized.includes("et")
  ) {
    return "live";
  }
  if (
    normalized.includes("ns") ||
    normalized.includes("not started") ||
    normalized.includes("scheduled") ||
    normalized.includes("tbd") ||
    normalized.includes("postpon") ||
    normalized.includes("ppd") ||
    normalized.includes("cancel") ||
    normalized.includes("delay") ||
    normalized.includes("suspend")
  ) {
    return "scheduled";
  }
  return hasScore ? "live" : "scheduled";
};

const buildStartTime = (event: TheSportsDbEvent) => {
  const timestamp = toIsoString(event.strTimestamp);
  if (timestamp) return timestamp;
  if (event.dateEvent) {
    const time = event.strTime?.trim();
    const composed = time
      ? `${event.dateEvent}T${time}`
      : `${event.dateEvent}T00:00:00`;
    const parsed = toIsoString(composed);
    if (parsed) return parsed;
    const fallback = toIsoString(event.dateEvent);
    if (fallback) return fallback;
  }
  return new Date().toISOString();
};

const mapEventToGame = (
  event: TheSportsDbEvent,
  fallbackLeagueId: string,
  index: number
): ProviderGame => {
  const homeScore = parseScore(event.intHomeScore);
  const awayScore = parseScore(event.intAwayScore);
  const hasScore = homeScore !== undefined || awayScore !== undefined;
  const status = parseStatus(event.strStatus, hasScore);
  const startTime = buildStartTime(event);
  const eventId = event.idEvent ?? `${fallbackLeagueId}-${index}`;
  const homeTeamId = event.idHomeTeam ?? `home-${eventId}`;
  const awayTeamId = event.idAwayTeam ?? `away-${eventId}`;
  const leagueId = event.idLeague ?? fallbackLeagueId;
  const lastUpdated = toIsoString(event.strTimestamp) ?? startTime;

  return {
    id: eventId,
    leagueId,
    startTime,
    status,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    lastUpdated,
  };
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const dedupeEvents = (events: TheSportsDbEvent[]) => {
  const seen = new Set<string>();
  return events.filter((event, index) => {
    const key = event.idEvent ?? `${event.idLeague ?? "league"}-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const theSportsDbProvider: Provider<
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard
> = {
  id: "thesportsdb",
  name: "TheSportsDB",
  async getLeagues(options?: ProviderFetchOptions) {
    const response = await fetchJson<TheSportsDbLeaguesResponse>(
      "all_leagues.php",
      options
    );
    return (response.leagues ?? [])
      .map((league) => {
        const id = trimOrUndefined(league.idLeague);
        const name = trimOrUndefined(league.strLeague);
        const sport = trimOrUndefined(league.strSport);
        if (!id || !name) return null;
        return {
          id,
          name,
          sport: sport ?? "Unknown",
        };
      })
      .filter((league): league is ProviderLeague => Boolean(league));
  },
  async getTeams(leagueId: string, options?: ProviderFetchOptions) {
    const response = await fetchJson<TheSportsDbTeamsResponse>(
      `lookup_all_teams.php?id=${leagueId}`,
      options
    );
    return (response.teams ?? [])
      .map((team) => {
        const id = trimOrUndefined(team.idTeam);
        const name = trimOrUndefined(team.strTeam);
        if (!id || !name) return null;
        const shortName =
          trimOrUndefined(team.strTeamShort) ??
          trimOrUndefined(team.strTeamAlternate) ??
          name;
        const logoUrl =
          trimOrUndefined(team.strTeamBadge) ??
          trimOrUndefined(team.strTeamLogo) ??
          trimOrUndefined(team.strTeamFanart1);
        return {
          id,
          leagueId: trimOrUndefined(team.idLeague) ?? leagueId,
          name,
          shortName,
          logoUrl,
        };
      })
      .filter((team): team is ProviderTeam => Boolean(team));
  },
  async getScores(request: ProviderScoresRequest, options?: ProviderFetchOptions) {
    const leagueIds = request.leagueIds ?? [];
    if (leagueIds.length === 0) return [];
    const targetDate = request.date ?? toDateString(new Date());

    const cards = await Promise.all(
      leagueIds.map(async (leagueId) => {
        const [next, past] = await Promise.all([
          fetchJson<TheSportsDbEventsResponse>(
            `eventsnextleague.php?id=${leagueId}`,
            options
          ),
          fetchJson<TheSportsDbEventsResponse>(
            `eventspastleague.php?id=${leagueId}`,
            options
          ),
        ]);
        const events = dedupeEvents([
          ...(next.events ?? []),
          ...(past.events ?? []),
        ]).filter((event) => event.dateEvent === targetDate);
        if (events.length === 0) return null;
        const games = events.map((event, index) =>
          mapEventToGame(event, leagueId, index)
        );
        const title = events.find((event) => event.strLeague)?.strLeague ?? leagueId;
        return {
          id: `card-${leagueId}`,
          leagueId,
          title,
          games,
        } satisfies ProviderScoreCard;
      })
    );

    return cards.filter((card): card is ProviderScoreCard => Boolean(card));
  },
};

export { fetchJson };
export default theSportsDbProvider;
