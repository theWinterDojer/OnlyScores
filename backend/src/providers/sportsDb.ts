import { sportsDbApiKey, sportsDbBaseUrl } from '../config';
import type {
  ProviderGame,
  ProviderLeague,
  ProviderScoreCard,
  ProviderScoresResponse,
  ProviderTeam,
} from '../types/provider';

type SportsDbLeague = {
  idLeague: string;
  strLeague: string;
  strSport: string;
};

type SportsDbTeam = {
  idTeam: string;
  idLeague?: string | null;
  strTeam: string;
  strTeamShort?: string | null;
  strTeamBadge?: string | null;
  strTeamLogo?: string | null;
};

type SportsDbEvent = {
  idEvent: string;
  idLeague?: string | null;
  strLeague?: string | null;
  strSport?: string | null;
  idHomeTeam?: string | null;
  idAwayTeam?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strTimestamp?: string | null;
};

type SportsDbLeaguesResponse = {
  leagues?: SportsDbLeague[] | null;
};

type SportsDbTeamsResponse = {
  teams?: SportsDbTeam[] | null;
};

type SportsDbEventsResponse = {
  events?: SportsDbEvent[] | null;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

const LEAGUES_TTL_MS = 6 * 60 * 60 * 1000;
const TEAMS_TTL_MS = 6 * 60 * 60 * 1000;
const SCORES_TTL_MS = 30 * 1000;

type CuratedLeague = {
  id: string;
  name: string;
  sport: string;
  providerName: string;
};

const curatedLeagues: CuratedLeague[] = [
  {
    id: '4391',
    name: 'NFL',
    sport: 'American Football',
    providerName: 'NFL',
  },
  {
    id: '4387',
    name: 'NBA',
    sport: 'Basketball',
    providerName: 'NBA',
  },
  {
    id: '4424',
    name: 'MLB',
    sport: 'Baseball',
    providerName: 'MLB',
  },
  {
    id: '4380',
    name: 'NHL',
    sport: 'Ice Hockey',
    providerName: 'NHL',
  },
  {
    id: '4328',
    name: 'Premier League',
    sport: 'Soccer',
    providerName: 'English Premier League',
  },
  {
    id: '4335',
    name: 'La Liga',
    sport: 'Soccer',
    providerName: 'Spanish La Liga',
  },
  {
    id: '4332',
    name: 'Serie A',
    sport: 'Soccer',
    providerName: 'Italian Serie A',
  },
  {
    id: '4331',
    name: 'Bundesliga',
    sport: 'Soccer',
    providerName: 'German Bundesliga',
  },
  {
    id: '4334',
    name: 'Ligue 1',
    sport: 'Soccer',
    providerName: 'French Ligue 1',
  },
  {
    id: '4346',
    name: 'MLS',
    sport: 'Soccer',
    providerName: 'American Major League Soccer',
  },
];

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const curatedById = new Map(curatedLeagues.map((league) => [league.id, league]));
const curatedByName = new Map(
  curatedLeagues.flatMap((league) => {
    const entries: [string, CuratedLeague][] = [];
    entries.push([normalizeKey(league.name), league]);
    entries.push([normalizeKey(league.providerName), league]);
    return entries;
  })
);

const buildUrl = (path: string, params?: Record<string, string | undefined>) => {
  const url = new URL(`${sportsDbBaseUrl}/${sportsDbApiKey}/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

const fetchJson = async <T>(path: string, params?: Record<string, string | undefined>) => {
  const response = await fetch(buildUrl(path, params));
  if (!response.ok) {
    throw new Error(`SportsDB request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

const fetchWithCache = async <T>(key: string, ttlMs: number, fetcher: () => Promise<T>) => {
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const value = await fetcher();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
};

const parseScore = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeStatus = (status?: string | null, homeScore?: number, awayScore?: number) => {
  if (!status || status.trim().length === 0) {
    if (homeScore !== undefined || awayScore !== undefined) return 'final';
    return 'scheduled' as const;
  }
  const normalized = status.trim().toLowerCase();
  if (
    normalized.includes('final') ||
    normalized.includes('finished') ||
    normalized.includes('ft') ||
    normalized.includes('full time') ||
    normalized.includes('match ended')
  ) {
    return 'final' as const;
  }
  if (
    normalized.includes('live') ||
    normalized.includes('in progress') ||
    normalized.includes('half') ||
    normalized.includes('quarter') ||
    normalized.includes('overtime')
  ) {
    return 'live' as const;
  }
  return 'scheduled' as const;
};

const buildEventStart = (event: SportsDbEvent) => {
  if (event.strTimestamp) {
    const date = new Date(event.strTimestamp);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  if (event.dateEvent) {
    if (event.strTime) {
      const date = new Date(`${event.dateEvent}T${event.strTime}`);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    const date = new Date(event.dateEvent);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
};

const buildLastUpdated = (event: SportsDbEvent) => {
  if (event.strTimestamp) {
    const date = new Date(event.strTimestamp);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
};

const getEventDateKey = (event: SportsDbEvent) => {
  if (event.dateEvent) return event.dateEvent;
  if (event.strTimestamp) {
    const date = new Date(event.strTimestamp);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  const start = buildEventStart(event);
  return start.slice(0, 10);
};

const mapTeam = (team: SportsDbTeam, leagueId: string): ProviderTeam => ({
  id: team.idTeam,
  leagueId,
  name: team.strTeam,
  shortName: team.strTeamShort?.trim() || team.strTeam,
  logoUrl: team.strTeamBadge || team.strTeamLogo || undefined,
});

const mapGame = (
  event: SportsDbEvent,
  leagueIdFallback?: string,
  overrides?: { leagueId?: string; homeTeamId?: string; awayTeamId?: string }
): ProviderGame => {
  const homeScore = parseScore(event.intHomeScore);
  const awayScore = parseScore(event.intAwayScore);
  return {
    id: event.idEvent,
    leagueId: overrides?.leagueId || event.idLeague || leagueIdFallback || 'unknown',
    startTime: buildEventStart(event),
    status: normalizeStatus(event.strStatus, homeScore, awayScore),
    homeTeamId: overrides?.homeTeamId || event.idHomeTeam || 'unknown',
    awayTeamId: overrides?.awayTeamId || event.idAwayTeam || 'unknown',
    homeScore,
    awayScore,
    lastUpdated: buildLastUpdated(event),
  };
};

export const getLeagues = async (): Promise<ProviderLeague[]> =>
  fetchWithCache('leagues', LEAGUES_TTL_MS, async () =>
    curatedLeagues.map((league) => ({
      id: league.id,
      name: league.name,
      sport: league.sport,
    }))
  );

const fetchTeamsByLeague = async (league: CuratedLeague) => {
  const payload = await fetchJson<SportsDbTeamsResponse>('search_all_teams.php', {
    l: league.providerName,
  });
  const teams = payload.teams ?? [];
  return teams.map((team) => mapTeam(team, league.id));
};

export const getTeams = async (leagueId: string): Promise<ProviderTeam[]> => {
  const league = curatedLeagues.find((item) => item.id === leagueId);
  if (!league) return [];
  return fetchWithCache(`teams:${leagueId}`, TEAMS_TTL_MS, () => fetchTeamsByLeague(league));
};

const fetchLeagueEvents = async (leagueId: string) => {
  const [past, next] = await Promise.all([
    fetchJson<SportsDbEventsResponse>('eventspastleague.php', { id: leagueId }),
    fetchJson<SportsDbEventsResponse>('eventsnextleague.php', { id: leagueId }),
  ]);
  return [...(past.events ?? []), ...(next.events ?? [])];
};

const fetchTeamEvents = async (teamId: string) => {
  const [past, next] = await Promise.all([
    fetchJson<SportsDbEventsResponse>('eventslast.php', { id: teamId }),
    fetchJson<SportsDbEventsResponse>('eventsnext.php', { id: teamId }),
  ]);
  return [...(past.events ?? []), ...(next.events ?? [])];
};

const resolveLeagueId = (event: SportsDbEvent) => {
  if (event.idLeague && curatedById.has(event.idLeague)) return event.idLeague;
  if (event.strLeague) {
    const match = curatedByName.get(normalizeKey(event.strLeague));
    if (match) return match.id;
  }
  return event.idLeague || 'unknown';
};

const buildTeamIndex = (teams: ProviderTeam[]) => {
  const ids = new Set<string>();
  const nameToId = new Map<string, string>();
  teams.forEach((team) => {
    ids.add(team.id);
    nameToId.set(normalizeKey(team.name), team.id);
    if (team.shortName) {
      nameToId.set(normalizeKey(team.shortName), team.id);
    }
  });
  return { ids, nameToId };
};

const resolveTeamId = (
  value: string | null | undefined,
  name: string | null | undefined,
  teamIndex?: { ids: Set<string>; nameToId: Map<string, string> }
) => {
  if (value && teamIndex?.ids.has(value)) return value;
  if (name && teamIndex) {
    const mapped = teamIndex.nameToId.get(normalizeKey(name));
    if (mapped) return mapped;
  }
  if (value) return value;
  if (name) return name;
  return 'unknown';
};

export type ScoresQuery = {
  leagueIds?: string[];
  teamIds?: string[];
  date?: string;
  window?: 'day' | 'week';
};

export const getScores = async ({
  leagueIds = [],
  teamIds = [],
  date,
  window,
}: ScoresQuery): Promise<ProviderScoresResponse> => {
  const shouldFilterByDate = Boolean(date && window !== 'week');
  const normalizedDate = date?.slice(0, 10);
  const fetchKey = `scores:${leagueIds.join(',')}|${teamIds.join(',')}|${date ?? ''}|${window ?? ''}`;

  const events = await fetchWithCache(fetchKey, SCORES_TTL_MS, async () => {
    if (leagueIds.length > 0) {
      const results = await Promise.all(leagueIds.map((id) => fetchLeagueEvents(id)));
      return results.flat();
    }
    if (teamIds.length > 0) {
      const results = await Promise.all(teamIds.map((id) => fetchTeamEvents(id)));
      return results.flat();
    }
    return [];
  });

  const filteredByDate =
    shouldFilterByDate && normalizedDate
      ? events.filter((event) => getEventDateKey(event) === normalizedDate)
      : events;

  const normalizedEvents = filteredByDate.map((event) => ({
    event,
    leagueId: resolveLeagueId(event),
  }));

  const leagueIdsForTeams = Array.from(
    new Set(normalizedEvents.map((entry) => entry.leagueId).filter((id) => id !== 'unknown'))
  );

  const teamIndexByLeagueId = new Map<string, ReturnType<typeof buildTeamIndex>>();
  await Promise.all(
    leagueIdsForTeams.map(async (leagueId) => {
      const teams = await getTeams(leagueId);
      teamIndexByLeagueId.set(leagueId, buildTeamIndex(teams));
    })
  );

  const resolvedEvents = normalizedEvents.map(({ event, leagueId }) => {
    const teamIndex = teamIndexByLeagueId.get(leagueId);
    const homeTeamId = resolveTeamId(event.idHomeTeam, event.strHomeTeam, teamIndex);
    const awayTeamId = resolveTeamId(event.idAwayTeam, event.strAwayTeam, teamIndex);
    return {
      event,
      leagueId,
      homeTeamId,
      awayTeamId,
    };
  });

  const filteredByTeam =
    teamIds.length > 0
      ? resolvedEvents.filter(
          (entry) => teamIds.includes(entry.homeTeamId) || teamIds.includes(entry.awayTeamId)
        )
      : resolvedEvents;

  const leagues = await getLeagues();
  const leagueById = new Map(leagues.map((league) => [league.id, league]));

  const cardsByLeague = new Map<string, ProviderScoreCard>();
  filteredByTeam.forEach(({ event, leagueId, homeTeamId, awayTeamId }) => {
    const league = leagueById.get(leagueId);
    const title = league?.name || event.strLeague || leagueId;
    const card = cardsByLeague.get(leagueId) ?? {
      id: leagueId,
      leagueId,
      title,
      games: [],
    };
    card.games.push(
      mapGame(event, leagueId, {
        leagueId,
        homeTeamId,
        awayTeamId,
      })
    );
    cardsByLeague.set(leagueId, card);
  });

  return {
    cards: Array.from(cardsByLeague.values()),
    fetchedAt: new Date().toISOString(),
  };
};
