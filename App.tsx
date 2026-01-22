import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import AppHeader from "./src/components/AppHeader";
import { getProvider } from "./src/providers";
import { readCache, writeCache } from "./src/providers/cache";
import type {
  ProviderGame,
  ProviderScoreCard,
  ProviderTeam,
} from "./src/types/provider";

type GameStatus = "scheduled" | "live" | "final";

type Game = {
  id: string;
  time: string; // e.g., "7:30 PM"
  awayTeam: string;
  homeTeam: string;
  awayScore?: number;
  homeScore?: number;
  status: GameStatus;
};

type ScoreCard = {
  id: string;
  title: string; // e.g., "NBA"
  games: Game[];
  lastUpdated?: string;
};

const SCORE_CACHE_KEY = "scores:latest:ui";

const formatScheduledTime = (startTime: string) => {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return "TBD";
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHours}:${minutes} ${period}`;
};

const formatGameTime = (game: ProviderGame) => {
  if (game.status === "live") return "LIVE";
  if (game.status === "final") return "FINAL";
  return formatScheduledTime(game.startTime);
};

const formatUpdatedLabel = (timestamp?: string) => {
  if (!timestamp) return "Updated --";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Updated --";
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `Updated ${normalizedHours}:${minutes} ${period}`;
};

const getCardLastUpdated = (games: ProviderGame[]) => {
  const latest = games.reduce<number | null>((current, game) => {
    const time = new Date(game.lastUpdated).getTime();
    if (Number.isNaN(time)) return current;
    if (current === null) return time;
    return Math.max(current, time);
  }, null);
  if (latest === null) return undefined;
  return new Date(latest).toISOString();
};

const buildTeamLookup = (teams: ProviderTeam[]) =>
  teams.reduce<Record<string, string>>((acc, team) => {
    acc[team.id] = team.shortName || team.name;
    return acc;
  }, {});

const normalizeCards = (
  cards: ProviderScoreCard[],
  teamLookup: Record<string, string>
): ScoreCard[] =>
  cards.map((card) => ({
    id: card.id,
    title: card.title,
    games: card.games.map((game) => ({
      id: game.id,
      time: formatGameTime(game),
      awayTeam: teamLookup[game.awayTeamId] ?? game.awayTeamId,
      homeTeam: teamLookup[game.homeTeamId] ?? game.homeTeamId,
      awayScore: game.awayScore,
      homeScore: game.homeScore,
      status: game.status,
    })),
    lastUpdated: getCardLastUpdated(card.games),
  }));

function StatusPill({ status }: { status: GameStatus }) {
  const label = status === "scheduled" ? "UPCOMING" : status.toUpperCase();
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function GameRow({ game }: { game: Game }) {
  const showScores = game.status !== "scheduled";
  return (
    <View style={styles.gameRow}>
      <View style={styles.gameLeft}>
        <Text style={styles.teamLine}>
          <Text style={styles.teamName}>{game.awayTeam}</Text>
          {showScores ? (
            <Text style={styles.score}>  {game.awayScore ?? "-"}</Text>
          ) : null}
        </Text>
        <Text style={styles.teamLine}>
          <Text style={styles.teamName}>{game.homeTeam}</Text>
          {showScores ? (
            <Text style={styles.score}>  {game.homeScore ?? "-"}</Text>
          ) : null}
        </Text>
      </View>

      <View style={styles.gameRight}>
        <StatusPill status={game.status} />
        <Text style={styles.timeText}>{game.time}</Text>
      </View>
    </View>
  );
}

function ScoreCardView({ card }: { card: ScoreCard }) {
  const [expanded, setExpanded] = useState(false);

  const visibleGames = useMemo(() => {
    if (expanded) return card.games;
    return card.games.slice(0, 10);
  }, [expanded, card.games]);

  const overflow = card.games.length > 10;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleStack}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.updatedText}>
            {formatUpdatedLabel(card.lastUpdated)}
          </Text>
        </View>

        {overflow ? (
          <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={10}>
            <Text style={styles.linkText}>
              {expanded ? "Show less" : `Show more (${card.games.length - 10})`}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {visibleGames.map((g) => (
        <GameRow key={g.id} game={g} />
      ))}
    </View>
  );
}

export default function App() {
  const [cards, setCards] = useState<ScoreCard[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      cards.length === 0 ? styles.listContentEmpty : null,
    ],
    [cards.length]
  );

  useEffect(() => {
    const hydrateAndFetch = async () => {
      try {
        const cached = await readCache<ScoreCard[]>(SCORE_CACHE_KEY);
        if (cached && isMountedRef.current) {
          setCards(cached);
        }
      } catch {
        // Ignore cache hydration failures.
      }

      await fetchScores();
    };

    hydrateAndFetch();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchScores = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const provider = getProvider();
      const providerCards = await provider.getScores({});
      const leagueIds = Array.from(
        new Set(providerCards.map((card) => card.leagueId))
      );
      const teams = (
        await Promise.all(
          leagueIds.map((leagueId) => provider.getTeams(leagueId))
        )
      ).flat();
      const normalized = normalizeCards(providerCards, buildTeamLookup(teams));
      if (isMountedRef.current) {
        setCards(normalized);
      }
      try {
        await writeCache(SCORE_CACHE_KEY, normalized);
      } catch {
        // Cache failures should not block score updates.
      }
    } catch {
      if (isMountedRef.current) {
        setErrorMessage("Unable to load scores. Check your connection.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsFetching(false);
      }
    }
  };

  const handleRetry = () => {
    if (isFetching) return;
    fetchScores();
  };

  const showLoadingState = cards.length === 0 && (isInitialLoading || isFetching);
  const showFullScreenError = cards.length === 0 && !!errorMessage && !isFetching;
  const showInlineError = cards.length > 0 && !!errorMessage;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />
      {showLoadingState ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading scores...</Text>
        </View>
      ) : showFullScreenError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Scores unavailable</Text>
          <Text style={styles.errorBody}>
            We couldn't refresh scores right now.
          </Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.retryButtonPressed : null,
            ]}
            disabled={isFetching}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={listContentStyle}
          renderItem={({ item }) => <ScoreCardView card={item} />}
          refreshing={isFetching}
          onRefresh={fetchScores}
          ListHeaderComponent={
            showInlineError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  Couldn't refresh scores.
                </Text>
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => [
                    styles.retryButtonSmall,
                    pressed ? styles.retryButtonPressed : null,
                  ]}
                  disabled={isFetching}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No games yet</Text>
              <Text style={styles.emptyBody}>
                Scores will appear here when games are scheduled.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F14" },

  listContent: { padding: 16, paddingTop: 8, gap: 12 },
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  emptyState: { alignItems: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  emptyBody: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  errorTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  errorBody: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorBannerText: { color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "white",
  },
  retryButtonSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
  },
  retryButtonPressed: { opacity: 0.8 },
  retryButtonText: { color: "#0B0F14", fontWeight: "800" },

  card: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  cardTitleStack: { gap: 2 },
  updatedText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
  },
  linkText: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },

  gameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  gameLeft: { flex: 1, paddingRight: 12 },
  teamLine: { color: "white", fontSize: 16, lineHeight: 20 },
  teamName: { fontWeight: "700", color: "white" },
  score: { fontWeight: "800", color: "white" },

  gameRight: { alignItems: "flex-end", gap: 6 },
  timeText: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },

  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  pillText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
