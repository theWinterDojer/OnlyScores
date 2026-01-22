import { Provider } from "./Provider";
import {
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard,
  ProviderGame,
  ProviderScoresResponse,
} from "../types/provider";
import { writeCache } from "./cache";

const leagues: ProviderLeague[] = [
  { id: "nba", name: "NBA", sport: "basketball" },
  { id: "nfl", name: "NFL", sport: "football" },
];

const nbaTeamNames = [
  "Magic",
  "Celtics",
  "Lakers",
  "Heat",
  "Knicks",
  "Bulls",
  "Warriors",
  "Nuggets",
];
const nflTeamNames = ["Bucs", "Bills", "Eagles", "Saints", "Jets", "Cowboys"];

const toTeamId = (leagueId: string, name: string) =>
  `${leagueId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const teams: ProviderTeam[] = [
  ...nbaTeamNames.map((name) => ({
    id: toTeamId("nba", name),
    leagueId: "nba",
    name,
    shortName: name,
  })),
  ...nflTeamNames.map((name) => ({
    id: toTeamId("nfl", name),
    leagueId: "nfl",
    name,
    shortName: name,
  })),
];

const parseTimeLabel = (label: string, baseDate: Date) => {
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  const date = new Date(baseDate);
  let adjustedHours = hours % 12;
  if (period === "PM") adjustedHours += 12;
  date.setHours(adjustedHours, minutes, 0, 0);
  return date;
};

const makeStartTime = (
  status: "scheduled" | "live" | "final",
  label: string,
  baseDate: Date
) => {
  const date = new Date(baseDate);
  if (status === "scheduled") {
    const parsed = parseTimeLabel(label, baseDate);
    return (parsed ?? date).toISOString();
  }
  if (status === "live") {
    date.setHours(date.getHours() - 1);
    return date.toISOString();
  }
  date.setHours(date.getHours() - 3);
  return date.toISOString();
};

const makeNbaGames = (baseDate: Date): ProviderGame[] =>
  Array.from({ length: 14 }).map((_, i) => {
    const status = i % 3 === 0 ? "live" : i % 3 === 1 ? "scheduled" : "final";
    const time = i % 3 === 0 ? "LIVE" : i % 3 === 1 ? "7:30 PM" : "FINAL";
    return {
      id: `nba-${i}`,
      leagueId: "nba",
      startTime: makeStartTime(status, time, baseDate),
      status,
      awayTeamId: toTeamId("nba", nbaTeamNames[i % 4]),
      homeTeamId: toTeamId("nba", nbaTeamNames[4 + (i % 4)]),
      awayScore: i % 3 === 1 ? undefined : 80 + i,
      homeScore: i % 3 === 1 ? undefined : 78 + i,
      lastUpdated: new Date().toISOString(),
    };
  });

const makeNflGames = (baseDate: Date): ProviderGame[] =>
  Array.from({ length: 6 }).map((_, i) => {
    const status = i % 2 === 0 ? "scheduled" : "final";
    const time = i % 2 === 0 ? "1:00 PM" : "FINAL";
    return {
      id: `nfl-${i}`,
      leagueId: "nfl",
      startTime: makeStartTime(status, time, baseDate),
      status,
      awayTeamId: toTeamId("nfl", nflTeamNames[i % 3]),
      homeTeamId: toTeamId("nfl", nflTeamNames[3 + (i % 3)]),
      awayScore: i % 2 === 0 ? undefined : 17 + i,
      homeScore: i % 2 === 0 ? undefined : 14 + i,
      lastUpdated: new Date().toISOString(),
    };
  });

const buildCards = (baseDate: Date): ProviderScoreCard[] => [
  {
    id: "card-nba",
    leagueId: "nba",
    title: "NBA",
    games: makeNbaGames(baseDate),
  },
  {
    id: "card-nfl",
    leagueId: "nfl",
    title: "NFL",
    games: makeNflGames(baseDate),
  },
];

const mockProvider: Provider<
  ProviderLeague,
  ProviderTeam,
  ProviderScoreCard
> = {
  id: "mock",
  name: "MockProvider",
  async getLeagues() {
    return leagues;
  },
  async getTeams(leagueId: string) {
    return teams.filter((team) => team.leagueId === leagueId);
  },
  async getScores(request) {
    const baseDate = request?.date ? new Date(request.date) : new Date();
    let cards = buildCards(baseDate);
    if (request?.leagueIds?.length) {
      const allowed = new Set(request.leagueIds);
      cards = cards.filter((card) => allowed.has(card.leagueId));
    }
    if (request?.teamIds?.length) {
      const allowed = new Set(request.teamIds);
      cards = cards
        .map((card) => ({
          ...card,
          games: card.games.filter(
            (game) =>
              allowed.has(game.homeTeamId) || allowed.has(game.awayTeamId)
          ),
        }))
        .filter((card) => card.games.length > 0);
    }
    const snapshot: ProviderScoresResponse = {
      cards,
      fetchedAt: new Date().toISOString(),
    };
    try {
      await writeCache("scores:latest", snapshot);
    } catch {
      // Cache failures should not block score fetches.
    }
    return cards;
  },
};

export default mockProvider;
