import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  AppState,
} from "react-native";
import AppHeader from "./src/components/AppHeader";
import ScoreCardView from "./src/components/ScoreCardView";
import { getProvider } from "./src/providers";
import { readCache, writeCache } from "./src/providers/cache";
import type {
  ProviderGame,
  ProviderScoreCard,
  ProviderTeam,
} from "./src/types/provider";
import type { ScoreCard } from "./src/types/score";

const SCORE_CACHE_KEY = "scores:latest:ui";
const CARD_ORDER_CACHE_KEY = "cards:order";
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000;

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

const applyCardOrder = (cards: ScoreCard[], order?: string[] | null) => {
  if (!order || order.length === 0) return cards;
  const byId = new Map(cards.map((card) => [card.id, card]));
  const orderSet = new Set(order);
  const ordered = order
    .map((id) => byId.get(id))
    .filter((card): card is ScoreCard => Boolean(card));
  const remaining = cards.filter((card) => !orderSet.has(card.id));
  return [...ordered, ...remaining];
};

export default function App() {
  const [cards, setCards] = useState<ScoreCard[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const cardOrderRef = useRef<string[] | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      cards.length === 0 ? styles.listContentEmpty : null,
    ],
    [cards.length]
  );

  const persistCardOrder = useCallback(async (nextCards: ScoreCard[]) => {
    const order = nextCards.map((card) => card.id);
    cardOrderRef.current = order;
    try {
      await writeCache(CARD_ORDER_CACHE_KEY, order);
    } catch {
      // Card order persistence should not block UI updates.
    }
  }, []);

  const moveCard = useCallback((fromIndex: number, direction: -1 | 1) => {
    setCards((prev) => {
      const targetIndex = fromIndex + direction;
      if (
        fromIndex < 0 ||
        targetIndex < 0 ||
        fromIndex >= prev.length ||
        targetIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      void persistCardOrder(next);
      return next;
    });
  }, [persistCardOrder]);

  const fetchScores = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
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
      const ordered = applyCardOrder(normalized, cardOrderRef.current);
      if (isMountedRef.current) {
        setCards(ordered);
      }
      try {
        await writeCache(SCORE_CACHE_KEY, ordered);
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
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const hydrateAndFetch = async () => {
      try {
        const cachedOrder = await readCache<string[]>(CARD_ORDER_CACHE_KEY);
        if (cachedOrder && cachedOrder.length > 0) {
          cardOrderRef.current = cachedOrder;
        }
        const cached = await readCache<ScoreCard[]>(SCORE_CACHE_KEY);
        if (cached && isMountedRef.current) {
          setCards(applyCardOrder(cached, cardOrderRef.current));
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
  }, [fetchScores]);

  const startAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) return;
    autoRefreshRef.current = setInterval(() => {
      fetchScores();
    }, AUTO_REFRESH_INTERVAL_MS);
  }, [fetchScores]);

  const stopAutoRefresh = useCallback(() => {
    if (!autoRefreshRef.current) return;
    clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = null;
  }, []);

  useEffect(() => {
    if (appStateRef.current === "active") {
      startAutoRefresh();
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasActive = appStateRef.current === "active";
      appStateRef.current = nextState;

      if (nextState === "active") {
        startAutoRefresh();
        if (!wasActive) {
          fetchScores();
        }
        return;
      }

      stopAutoRefresh();
    });

    return () => {
      stopAutoRefresh();
      subscription.remove();
    };
  }, [fetchScores, startAutoRefresh, stopAutoRefresh]);

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
          renderItem={({ item, index }) => (
            <ScoreCardView
              card={item}
              onMoveUp={() => moveCard(index, -1)}
              onMoveDown={() => moveCard(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < cards.length - 1}
            />
          )}
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
});
