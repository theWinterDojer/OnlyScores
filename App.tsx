import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  AppState,
  LayoutAnimation,
  PanResponder,
  Platform,
  UIManager,
} from "react-native";
import type { LayoutChangeEvent } from "react-native";
import AppHeader from "./src/components/AppHeader";
import ScoreCardView from "./src/components/ScoreCardView";
import {
  configureNotifications,
  ensureNotificationPermissions,
  fetchExpoPushToken,
  getCachedPushToken,
} from "./src/notifications/notifications";
import { getProvider } from "./src/providers";
import { readCache, writeCache } from "./src/providers/cache";
import { submitDeviceSubscription } from "./src/providers/notifications";
import {
  DEFAULT_NOTIFICATION_PREFS,
  NotificationPrefsByCard,
  NotificationSettingKey,
} from "./src/types/notifications";
import type {
  ProviderGame,
  ProviderLeague,
  ProviderScoreCard,
  ProviderTeam,
} from "./src/types/provider";
import type { ScoreCard } from "./src/types/score";

const SCORE_CACHE_KEY = "scores:latest:ui";
const CARD_ORDER_CACHE_KEY = "cards:order";
const SELECTION_CACHE_KEY = "selection:preferences";
const NOTIFICATION_PREFS_CACHE_KEY = "cards:notifications";
const REFRESH_INTERVAL_CACHE_KEY = "settings:refresh-interval-seconds";
const DEFAULT_REFRESH_INTERVAL_SECONDS = 60;
const REFRESH_INTERVAL_MIN_SECONDS = 60;
const REFRESH_INTERVAL_MAX_SECONDS = 120;
const REFRESH_INTERVAL_STEP_SECONDS = 10;

type SelectionPreferences = {
  leagueIds: string[];
  teamIds: string[];
};

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

const getLatestCardUpdated = (cards: ScoreCard[]) => {
  const latest = cards.reduce<number | null>((current, card) => {
    if (!card.lastUpdated) return current;
    const time = new Date(card.lastUpdated).getTime();
    if (Number.isNaN(time)) return current;
    if (current === null) return time;
    return Math.max(current, time);
  }, null);
  if (latest === null) return undefined;
  return new Date(latest).toISOString();
};

type TeamDisplay = {
  name: string;
  logoUrl?: string;
};

const buildTeamLookup = (teams: ProviderTeam[]) =>
  teams.reduce<Record<string, TeamDisplay>>((acc, team) => {
    acc[team.id] = {
      name: team.shortName || team.name,
      logoUrl: team.logoUrl,
    };
    return acc;
  }, {});

const normalizeCards = (
  cards: ProviderScoreCard[],
  teamLookup: Record<string, TeamDisplay>
): ScoreCard[] =>
  cards.map((card) => ({
    id: card.id,
    title: card.title,
    games: card.games.map((game) => {
      const awayTeam = teamLookup[game.awayTeamId];
      const homeTeam = teamLookup[game.homeTeamId];
      return {
        id: game.id,
        time: formatGameTime(game),
        awayTeam: awayTeam?.name ?? game.awayTeamId,
        homeTeam: homeTeam?.name ?? game.homeTeamId,
        awayLogoUrl: awayTeam?.logoUrl,
        homeLogoUrl: homeTeam?.logoUrl,
        awayScore: game.awayScore,
        homeScore: game.homeScore,
        status: game.status,
      };
    }),
    lastUpdated: getCardLastUpdated(card.games),
  }));

const filterCardsByTeamIds = (
  cards: ProviderScoreCard[],
  teamIds: string[]
): ProviderScoreCard[] => {
  if (teamIds.length === 0) return cards;
  const teamSet = new Set(teamIds);
  return cards
    .map((card) => ({
      ...card,
      games: card.games.filter(
        (game) => teamSet.has(game.homeTeamId) || teamSet.has(game.awayTeamId)
      ),
    }))
    .filter((card) => card.games.length > 0);
};

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

const toggleId = (current: string[], id: string) =>
  current.includes(id) ? current.filter((value) => value !== id) : [...current, id];

type DraggableScoreCardProps = {
  card: ScoreCard;
  isDragging: boolean;
  dragTranslation: Animated.Value;
  onDragStart: (id: string) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  onLayout: (id: string, event: LayoutChangeEvent) => void;
};

function DraggableScoreCard({
  card,
  isDragging,
  dragTranslation,
  onDragStart,
  onDragMove,
  onDragEnd,
  onLayout,
}: DraggableScoreCardProps) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => onDragStart(card.id),
        onPanResponderMove: (_, gestureState) => onDragMove(gestureState.dy),
        onPanResponderRelease: onDragEnd,
        onPanResponderTerminate: onDragEnd,
      }),
    [card.id, onDragStart, onDragEnd, onDragMove]
  );

  return (
    <Animated.View
      onLayout={(event) => onLayout(card.id, event)}
      style={[
        styles.draggableCard,
        isDragging ? styles.draggableCardActive : null,
        isDragging ? { transform: [{ translateY: dragTranslation }] } : null,
      ]}
    >
      <ScoreCardView card={card} dragHandleProps={panResponder.panHandlers} />
    </Animated.View>
  );
}

export default function App() {
  const [cards, setCards] = useState<ScoreCard[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<"leagues" | "teams">(
    "leagues"
  );
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<ProviderLeague[]>([]);
  const [teamsByLeagueId, setTeamsByLeagueId] = useState<
    Record<string, ProviderTeam[]>
  >({});
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPrefsByCard>({});
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(
    DEFAULT_REFRESH_INTERVAL_SECONDS
  );
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const cardOrderRef = useRef<string[] | null>(null);
  const cardsRef = useRef<ScoreCard[]>([]);
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragStartYRef = useRef(0);
  const draggingIdRef = useRef<string | null>(null);
  const itemLayoutsRef = useRef<Record<string, { y: number; height: number }>>(
    {}
  );
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isDragging = draggingCardId !== null;
  const refreshIntervalMs = refreshIntervalSeconds * 1000;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      cards.length === 0 ? styles.listContentEmpty : null,
    ],
    [cards.length]
  );
  const leagueNameById = useMemo(
    () =>
      leagues.reduce<Record<string, string>>((acc, league) => {
        acc[league.id] = league.name;
        return acc;
      }, {}),
    [leagues]
  );
  const teamLeagueLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    Object.entries(teamsByLeagueId).forEach(([leagueId, teams]) => {
      teams.forEach((team) => {
        lookup[team.id] = leagueId;
      });
    });
    return lookup;
  }, [teamsByLeagueId]);
  const selectedLeagueSet = useMemo(
    () => new Set(selectedLeagueIds),
    [selectedLeagueIds]
  );
  const hasNotificationsEnabled = useMemo(
    () =>
      cards.some((card) => {
        const prefs = notificationPrefs[card.id] ?? DEFAULT_NOTIFICATION_PREFS;
        return prefs.notifyStart || prefs.notifyScore || prefs.notifyFinal;
      }),
    [cards, notificationPrefs]
  );
  const latestUpdated = useMemo(() => getLatestCardUpdated(cards), [cards]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const hydrateRefreshInterval = async () => {
      try {
        const cached = await readCache<number>(REFRESH_INTERVAL_CACHE_KEY);
        if (typeof cached !== "number" || !Number.isFinite(cached)) return;
        const rounded =
          Math.round(cached / REFRESH_INTERVAL_STEP_SECONDS) *
          REFRESH_INTERVAL_STEP_SECONDS;
        const normalized = Math.min(
          REFRESH_INTERVAL_MAX_SECONDS,
          Math.max(REFRESH_INTERVAL_MIN_SECONDS, rounded)
        );
        if (isMountedRef.current) {
          setRefreshIntervalSeconds(normalized);
        }
      } catch {
        // Ignore refresh interval hydration failures.
      }
    };

    hydrateRefreshInterval();
  }, []);
  const offlineBannerLabel = useMemo(
    () => `Offline - ${formatUpdatedLabel(latestUpdated)}`,
    [latestUpdated]
  );

  const handleToggleLeague = useCallback(
    (leagueId: string) => {
      setSelectedLeagueIds((prev) => {
        const next = toggleId(prev, leagueId);
        if (prev.includes(leagueId)) {
          setSelectedTeamIds((currentTeams) =>
            currentTeams.filter(
              (teamId) => teamLeagueLookup[teamId] !== leagueId
            )
          );
        }
        return next;
      });
    },
    [teamLeagueLookup]
  );

  const handleToggleTeam = useCallback((teamId: string) => {
    setSelectedTeamIds((prev) => toggleId(prev, teamId));
  }, []);

  useEffect(() => {
    const hydrateSelection = async () => {
      try {
        const cached = await readCache<SelectionPreferences>(
          SELECTION_CACHE_KEY
        );
        if (cached) {
          setSelectedLeagueIds(cached.leagueIds);
          setSelectedTeamIds(cached.teamIds);
        }
        if (cached && cached.leagueIds.length > 0) {
          setIsOnboarding(false);
        }
      } catch {
        // Ignore selection hydration failures.
      } finally {
        setSelectionHydrated(true);
      }
    };

    hydrateSelection();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void configureNotifications();
  }, []);

  useEffect(() => {
    const hydratePushToken = async () => {
      const cachedToken = await getCachedPushToken();
      if (cachedToken && isMountedRef.current) {
        setPushToken(cachedToken);
      }
    };

    hydratePushToken();
  }, []);

  useEffect(() => {
    if (!selectionHydrated) return;
    const hydrateNotificationPrefs = async () => {
      try {
        const cached = await readCache<NotificationPrefsByCard>(
          NOTIFICATION_PREFS_CACHE_KEY
        );
        if (cached && isMountedRef.current) {
          setNotificationPrefs(cached);
        }
      } catch {
        // Ignore notification preference hydration failures.
      }
    };

    hydrateNotificationPrefs();
  }, [selectionHydrated]);

  useEffect(() => {
    let isActive = true;
    const prepareNotifications = async () => {
      if (!hasNotificationsEnabled) {
        if (isActive) {
          setNotificationPermissionGranted(false);
        }
        return;
      }
      const granted = await ensureNotificationPermissions();
      if (!isActive) return;
      setNotificationPermissionGranted(granted);
      if (!granted || pushToken) return;
      const token = await fetchExpoPushToken();
      if (token && isActive) {
        setPushToken(token);
      }
    };

    prepareNotifications();

    return () => {
      isActive = false;
    };
  }, [hasNotificationsEnabled, pushToken]);

  useEffect(() => {
    if (!selectionHydrated || isOnboarding) return;
    if (!notificationPermissionGranted || !pushToken) return;
    if (!hasNotificationsEnabled) return;
    const payload = {
      expoPushToken: pushToken,
      leagueIds: selectedLeagueIds,
      teamIds: selectedTeamIds,
      preferences: notificationPrefs,
    };

    const submitSubscription = async () => {
      try {
        await submitDeviceSubscription(payload);
      } catch {
        // Subscription sync failures should not block the UI.
      }
    };

    submitSubscription();
  }, [
    selectionHydrated,
    isOnboarding,
    notificationPermissionGranted,
    pushToken,
    hasNotificationsEnabled,
    selectedLeagueIds,
    selectedTeamIds,
    notificationPrefs,
  ]);

  const persistCardOrder = useCallback(async (nextCards: ScoreCard[]) => {
    const order = nextCards.map((card) => card.id);
    cardOrderRef.current = order;
    try {
      await writeCache(CARD_ORDER_CACHE_KEY, order);
    } catch {
      // Card order persistence should not block UI updates.
    }
  }, []);

  const persistNotificationPrefs = useCallback(
    async (nextPrefs: NotificationPrefsByCard) => {
      try {
        await writeCache(NOTIFICATION_PREFS_CACHE_KEY, nextPrefs);
      } catch {
        // Notification preference persistence should not block UI updates.
      }
    },
    []
  );

  const ensureNotificationPrefs = useCallback(
    (nextCards: ScoreCard[]) => {
      setNotificationPrefs((prev) => {
        let changed = false;
        const next = { ...prev };
        nextCards.forEach((card) => {
          if (!next[card.id]) {
            next[card.id] = { ...DEFAULT_NOTIFICATION_PREFS };
            changed = true;
          }
        });
        if (changed) {
          void persistNotificationPrefs(next);
        }
        return changed ? next : prev;
      });
    },
    [persistNotificationPrefs]
  );

  const persistRefreshInterval = useCallback(async (nextSeconds: number) => {
    try {
      await writeCache(REFRESH_INTERVAL_CACHE_KEY, nextSeconds);
    } catch {
      // Refresh interval persistence should not block UI updates.
    }
  }, []);

  const updateRefreshInterval = useCallback(
    (nextSeconds: number) => {
      const rounded =
        Math.round(nextSeconds / REFRESH_INTERVAL_STEP_SECONDS) *
        REFRESH_INTERVAL_STEP_SECONDS;
      const normalized = Math.min(
        REFRESH_INTERVAL_MAX_SECONDS,
        Math.max(REFRESH_INTERVAL_MIN_SECONDS, rounded)
      );
      setRefreshIntervalSeconds(normalized);
      void persistRefreshInterval(normalized);
    },
    [persistRefreshInterval]
  );

  const handleCardLayout = useCallback(
    (id: string, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      itemLayoutsRef.current[id] = { y, height };
    },
    []
  );

  const beginDrag = useCallback(
    (id: string) => {
      const layout = itemLayoutsRef.current[id];
      if (!layout) return;
      draggingIdRef.current = id;
      dragStartYRef.current = layout.y;
      dragTranslateY.setValue(0);
      setDraggingCardId(id);
    },
    [dragTranslateY]
  );

  const handleDragMove = useCallback(
    (dy: number) => {
      const activeId = draggingIdRef.current;
      if (!activeId) return;
      dragTranslateY.setValue(dy);
      const currentCards = cardsRef.current;
      const dragY = dragStartYRef.current + dy;
      let targetIndex = 0;

      currentCards.forEach((card) => {
        if (card.id === activeId) return;
        const layout = itemLayoutsRef.current[card.id];
        if (!layout) {
          targetIndex += 1;
          return;
        }
        const midpoint = layout.y + layout.height / 2;
        if (dragY >= midpoint) {
          targetIndex += 1;
        }
      });

      const currentIndex = currentCards.findIndex((card) => card.id === activeId);
      if (currentIndex < 0 || targetIndex === currentIndex) return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCards((prev) => {
        const fromIndex = prev.findIndex((card) => card.id === activeId);
        if (fromIndex < 0) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        const insertIndex = Math.min(Math.max(targetIndex, 0), next.length);
        next.splice(insertIndex, 0, moved);
        return next;
      });
    },
    [dragTranslateY]
  );

  const handleDragEnd = useCallback(() => {
    if (!draggingIdRef.current) return;
    dragTranslateY.setValue(0);
    draggingIdRef.current = null;
    setDraggingCardId(null);
    void persistCardOrder(cardsRef.current);
  }, [dragTranslateY, persistCardOrder]);

  const loadLeagues = useCallback(async () => {
    setIsLoadingLeagues(true);
    setOnboardingError(null);
    try {
      const provider = getProvider();
      const fetched = await provider.getLeagues();
      if (isMountedRef.current) {
        setLeagues(fetched);
      }
    } catch {
      if (isMountedRef.current) {
        setOnboardingError("Unable to load leagues right now.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingLeagues(false);
      }
    }
  }, []);

  const loadTeamsForLeagues = useCallback(
    async (leagueIds: string[]) => {
      if (leagueIds.length === 0) {
        setTeamsByLeagueId({});
        setSelectedTeamIds([]);
        return;
      }
      setIsLoadingTeams(true);
      setOnboardingError(null);
      try {
        const provider = getProvider();
        const results = await Promise.all(
          leagueIds.map((leagueId) => provider.getTeams(leagueId))
        );
        const nextTeams: Record<string, ProviderTeam[]> = {};
        leagueIds.forEach((leagueId, index) => {
          nextTeams[leagueId] = results[index] ?? [];
        });
        if (isMountedRef.current) {
          setTeamsByLeagueId(nextTeams);
        }
      } catch {
        if (isMountedRef.current) {
          setOnboardingError("Unable to load teams right now.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoadingTeams(false);
        }
      }
    },
    []
  );

  const fetchScores = useCallback(async () => {
    if (isOnboarding) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const provider = getProvider();
      const request = {
        leagueIds: selectedLeagueIds,
        teamIds: selectedTeamIds,
      };
      const providerCards = await provider.getScores(request);
      const filteredCards = filterCardsByTeamIds(
        providerCards,
        selectedTeamIds
      );
      const leagueIds = Array.from(
        new Set(filteredCards.map((card) => card.leagueId))
      );
      const teams = (
        await Promise.all(
          leagueIds.map((leagueId) => provider.getTeams(leagueId))
        )
      ).flat();
      const normalized = normalizeCards(filteredCards, buildTeamLookup(teams));
      const ordered = applyCardOrder(normalized, cardOrderRef.current);
      if (isMountedRef.current) {
        setCards(ordered);
        setIsOffline(false);
        ensureNotificationPrefs(ordered);
      }
      try {
        await writeCache(SCORE_CACHE_KEY, ordered);
      } catch {
        // Cache failures should not block score updates.
      }
    } catch {
      if (isMountedRef.current) {
        setErrorMessage("Unable to load scores. Check your connection.");
        setIsOffline(true);
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsFetching(false);
      }
      isFetchingRef.current = false;
    }
  }, [
    isOnboarding,
    selectedLeagueIds,
    selectedTeamIds,
  ]);

  useEffect(() => {
    if (!selectionHydrated || !isOnboarding || onboardingStep !== "leagues") {
      return;
    }
    if (leagues.length > 0) return;
    void loadLeagues();
  }, [
    selectionHydrated,
    isOnboarding,
    onboardingStep,
    leagues.length,
    loadLeagues,
  ]);

  useEffect(() => {
    if (!selectionHydrated || !isOnboarding || onboardingStep !== "teams") {
      return;
    }
    void loadTeamsForLeagues(selectedLeagueIds);
  }, [
    selectionHydrated,
    isOnboarding,
    onboardingStep,
    selectedLeagueIds,
    loadTeamsForLeagues,
  ]);

  useEffect(() => {
    if (!selectionHydrated || isOnboarding) return;
    const hydrateAndFetch = async () => {
      try {
        const cachedOrder = await readCache<string[]>(CARD_ORDER_CACHE_KEY);
        if (cachedOrder && cachedOrder.length > 0) {
          cardOrderRef.current = cachedOrder;
        }
        const cached = await readCache<ScoreCard[]>(SCORE_CACHE_KEY);
        if (cached && isMountedRef.current) {
          setCards(applyCardOrder(cached, cardOrderRef.current));
          ensureNotificationPrefs(cached);
        }
      } catch {
        // Ignore cache hydration failures.
      }

      await fetchScores();
    };

    hydrateAndFetch();
  }, [fetchScores, selectionHydrated, isOnboarding]);

  const startAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) return;
    autoRefreshRef.current = setInterval(() => {
      fetchScores();
    }, refreshIntervalMs);
  }, [fetchScores, refreshIntervalMs]);

  const stopAutoRefresh = useCallback(() => {
    if (!autoRefreshRef.current) return;
    clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = null;
  }, []);

  const handleStartTeams = () => {
    setOnboardingStep("teams");
  };

  const handleBackToLeagues = () => {
    setOnboardingStep("leagues");
  };

  const handleFinishOnboarding = useCallback(async () => {
    if (selectedLeagueIds.length === 0) return;
    const leagueSet = new Set(selectedLeagueIds);
    const filteredTeamIds = selectedTeamIds.filter((teamId) => {
      const leagueId = teamLeagueLookup[teamId];
      return leagueId ? leagueSet.has(leagueId) : false;
    });
    const nextSelection: SelectionPreferences = {
      leagueIds: [...selectedLeagueIds],
      teamIds: filteredTeamIds,
    };
    try {
      await writeCache(SELECTION_CACHE_KEY, nextSelection);
    } catch {
      // Preference persistence should not block onboarding completion.
    }
    if (isMountedRef.current) {
      setIsOnboarding(false);
      setOnboardingStep("leagues");
      setIsInitialLoading(true);
    }
  }, [selectedLeagueIds, selectedTeamIds, teamLeagueLookup]);

  useEffect(() => {
    if (isOnboarding) return;
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
  }, [fetchScores, startAutoRefresh, stopAutoRefresh, isOnboarding]);

  useEffect(() => {
    if (isOnboarding) return;
    if (appStateRef.current !== "active") return;
    stopAutoRefresh();
    startAutoRefresh();
  }, [isOnboarding, startAutoRefresh, stopAutoRefresh, refreshIntervalMs]);

  const handleRetry = () => {
    if (isFetching) return;
    fetchScores();
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleDecreaseRefresh = useCallback(() => {
    updateRefreshInterval(refreshIntervalSeconds - REFRESH_INTERVAL_STEP_SECONDS);
  }, [refreshIntervalSeconds, updateRefreshInterval]);

  const handleIncreaseRefresh = useCallback(() => {
    updateRefreshInterval(refreshIntervalSeconds + REFRESH_INTERVAL_STEP_SECONDS);
  }, [refreshIntervalSeconds, updateRefreshInterval]);

  const handleToggleNotification = useCallback(
    (cardId: string, key: NotificationSettingKey) => {
      setNotificationPrefs((prev) => {
        const current = prev[cardId] ?? DEFAULT_NOTIFICATION_PREFS;
        const nextCard = { ...current, [key]: !current[key] };
        const next = { ...prev, [cardId]: nextCard };
        void persistNotificationPrefs(next);
        return next;
      });
    },
    [persistNotificationPrefs]
  );

  const showSelectionLoading = !selectionHydrated;
  const showOnboarding = selectionHydrated && isOnboarding;
  const showLoadingState = cards.length === 0 && (isInitialLoading || isFetching);
  const showFullScreenError = cards.length === 0 && !!errorMessage && !isFetching;
  const showOfflineBanner = cards.length > 0 && isOffline;
  const showInlineError = cards.length > 0 && !!errorMessage && !isOffline;

  if (showSelectionLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    const isLeagueStep = onboardingStep === "leagues";
    const canContinue = selectedLeagueIds.length > 0;
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.onboardingContainer}>
          <Text style={styles.onboardingTitle}>
            {isLeagueStep ? "Pick your leagues" : "Choose teams"}
          </Text>
          <Text style={styles.onboardingSubtitle}>
            {isLeagueStep
              ? "Select one or more leagues to build your home screen."
              : "Optional: pick teams to keep scores even tighter."}
          </Text>
          {onboardingError ? (
            <View style={styles.onboardingError}>
              <Text style={styles.onboardingErrorText}>{onboardingError}</Text>
            </View>
          ) : null}
          {isLeagueStep ? (
            isLoadingLeagues ? (
              <View style={styles.onboardingLoading}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Loading leagues...</Text>
              </View>
            ) : leagues.length > 0 ? (
              <ScrollView contentContainerStyle={styles.onboardingList}>
                {leagues.map((league) => {
                  const selected = selectedLeagueSet.has(league.id);
                  return (
                    <Pressable
                      key={league.id}
                      onPress={() => handleToggleLeague(league.id)}
                    >
                      <View
                        style={[
                          styles.choiceRow,
                          selected ? styles.choiceRowSelected : null,
                        ]}
                      >
                        <Text style={styles.choiceText}>{league.name}</Text>
                        <Text
                          style={[
                            styles.choiceTag,
                            selected ? styles.choiceTagActive : null,
                          ]}
                        >
                          {selected ? "Selected" : "Tap to add"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No leagues available</Text>
                <Text style={styles.emptyBody}>
                  Try again once leagues load from the provider.
                </Text>
              </View>
            )
          ) : isLoadingTeams ? (
            <View style={styles.onboardingLoading}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Loading teams...</Text>
            </View>
          ) : selectedLeagueIds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Pick a league first</Text>
              <Text style={styles.emptyBody}>
                Choose at least one league before selecting teams.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.onboardingList}>
              {selectedLeagueIds.map((leagueId) => {
                const teams = teamsByLeagueId[leagueId] ?? [];
                return (
                  <View key={leagueId} style={styles.teamGroup}>
                    <Text style={styles.teamGroupTitle}>
                      {leagueNameById[leagueId] ?? leagueId}
                    </Text>
                    {teams.length === 0 ? (
                      <Text style={styles.teamGroupEmpty}>No teams yet.</Text>
                    ) : (
                      teams.map((team) => {
                        const selected = selectedTeamIds.includes(team.id);
                        return (
                          <Pressable
                            key={team.id}
                            onPress={() => handleToggleTeam(team.id)}
                          >
                            <View
                              style={[
                                styles.choiceRow,
                                selected ? styles.choiceRowSelected : null,
                              ]}
                            >
                              <Text style={styles.choiceText}>{team.name}</Text>
                              <Text
                                style={[
                                  styles.choiceTag,
                                  selected ? styles.choiceTagActive : null,
                                ]}
                              >
                                {selected ? "Selected" : "Tap to add"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
          <View style={styles.onboardingFooter}>
            {isLeagueStep ? (
              <Pressable
                onPress={handleStartTeams}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canContinue ? styles.primaryButtonDisabled : null,
                  pressed && canContinue ? styles.primaryButtonPressed : null,
                ]}
                disabled={!canContinue}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            ) : (
              <View style={styles.onboardingFooterRow}>
                <Pressable
                  onPress={handleBackToLeagues}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed ? styles.secondaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleFinishOnboarding}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed ? styles.primaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Finish</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isSettingsOpen) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader
          title="Settings"
          subtitle="Notification preferences"
          actionLabel="Done"
          onActionPress={handleCloseSettings}
        />
        <ScrollView contentContainerStyle={styles.settingsContent}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsCardTitle}>Refresh interval</Text>
            <View style={styles.settingsToggleRow}>
              <Text style={styles.settingsToggleLabel}>Every</Text>
              <View style={styles.refreshControl}>
                <Pressable
                  onPress={handleDecreaseRefresh}
                  disabled={refreshIntervalSeconds <= REFRESH_INTERVAL_MIN_SECONDS}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    styles.toggleButtonOff,
                    pressed ? styles.toggleButtonPressed : null,
                    refreshIntervalSeconds <= REFRESH_INTERVAL_MIN_SECONDS
                      ? styles.toggleButtonDisabled
                      : null,
                  ]}
                >
                  <Text style={[styles.toggleButtonText, styles.toggleButtonTextOff]}>
                    -
                  </Text>
                </Pressable>
                <View style={styles.refreshValue}>
                  <Text style={styles.refreshValueText}>
                    {refreshIntervalSeconds}s
                  </Text>
                </View>
                <Pressable
                  onPress={handleIncreaseRefresh}
                  disabled={refreshIntervalSeconds >= REFRESH_INTERVAL_MAX_SECONDS}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    styles.toggleButtonOff,
                    pressed ? styles.toggleButtonPressed : null,
                    refreshIntervalSeconds >= REFRESH_INTERVAL_MAX_SECONDS
                      ? styles.toggleButtonDisabled
                      : null,
                  ]}
                >
                  <Text style={[styles.toggleButtonText, styles.toggleButtonTextOff]}>
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.refreshHint}>
              Range {REFRESH_INTERVAL_MIN_SECONDS}-{REFRESH_INTERVAL_MAX_SECONDS}{" "}
              seconds.
            </Text>
          </View>
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptyBody}>
                Choose leagues or teams to enable notifications.
              </Text>
            </View>
          ) : (
            cards.map((card) => {
              const prefs =
                notificationPrefs[card.id] ?? DEFAULT_NOTIFICATION_PREFS;
              return (
                <View key={card.id} style={styles.settingsCard}>
                  <Text style={styles.settingsCardTitle}>{card.title}</Text>
                  <View style={styles.settingsToggleRow}>
                    <Text style={styles.settingsToggleLabel}>Game start</Text>
                    <Pressable
                      onPress={() =>
                        handleToggleNotification(card.id, "notifyStart")
                      }
                      style={({ pressed }) => [
                        styles.toggleButton,
                        prefs.notifyStart
                          ? styles.toggleButtonOn
                          : styles.toggleButtonOff,
                        pressed ? styles.toggleButtonPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          prefs.notifyStart
                            ? styles.toggleButtonTextOn
                            : styles.toggleButtonTextOff,
                        ]}
                      >
                        {prefs.notifyStart ? "On" : "Off"}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.settingsToggleRow}>
                    <Text style={styles.settingsToggleLabel}>Score change</Text>
                    <Pressable
                      onPress={() =>
                        handleToggleNotification(card.id, "notifyScore")
                      }
                      style={({ pressed }) => [
                        styles.toggleButton,
                        prefs.notifyScore
                          ? styles.toggleButtonOn
                          : styles.toggleButtonOff,
                        pressed ? styles.toggleButtonPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          prefs.notifyScore
                            ? styles.toggleButtonTextOn
                            : styles.toggleButtonTextOff,
                        ]}
                      >
                        {prefs.notifyScore ? "On" : "Off"}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.settingsToggleRow}>
                    <Text style={styles.settingsToggleLabel}>Final</Text>
                    <Pressable
                      onPress={() =>
                        handleToggleNotification(card.id, "notifyFinal")
                      }
                      style={({ pressed }) => [
                        styles.toggleButton,
                        prefs.notifyFinal
                          ? styles.toggleButtonOn
                          : styles.toggleButtonOff,
                        pressed ? styles.toggleButtonPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          prefs.notifyFinal
                            ? styles.toggleButtonTextOn
                            : styles.toggleButtonTextOff,
                        ]}
                      >
                        {prefs.notifyFinal ? "On" : "Off"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader actionLabel="Settings" onActionPress={handleOpenSettings} />
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
          renderItem={({ item }) => (
            <DraggableScoreCard
              card={item}
              isDragging={draggingCardId === item.id}
              dragTranslation={dragTranslateY}
              onDragStart={beginDrag}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onLayout={handleCardLayout}
            />
          )}
          refreshing={isFetching}
          onRefresh={fetchScores}
          scrollEnabled={!isDragging}
          ListHeaderComponent={
            showOfflineBanner || showInlineError ? (
              <View style={styles.listHeader}>
                {showOfflineBanner ? (
                  <View style={styles.offlineBanner}>
                    <Text style={styles.offlineBannerText}>
                      {offlineBannerLabel}
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
                ) : null}
                {showInlineError ? (
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
                ) : null}
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
  listHeader: { gap: 10 },
  draggableCard: { position: "relative" },
  draggableCardActive: {
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

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
  offlineBanner: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  offlineBannerText: { color: "white", fontWeight: "700" },
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

  onboardingContainer: { flex: 1, padding: 20, gap: 16 },
  onboardingTitle: { color: "white", fontSize: 24, fontWeight: "800" },
  onboardingSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  onboardingError: {
    backgroundColor: "rgba(255,80,80,0.12)",
    borderRadius: 12,
    padding: 12,
  },
  onboardingErrorText: { color: "#FFB3B3", fontWeight: "600" },
  onboardingLoading: { alignItems: "center", gap: 12, paddingVertical: 24 },
  onboardingList: { gap: 12, paddingBottom: 24 },
  choiceRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceRowSelected: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  choiceText: { color: "white", fontSize: 16, fontWeight: "700" },
  choiceTag: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  choiceTagActive: { color: "white" },
  teamGroup: { gap: 8 },
  teamGroupTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 6,
  },
  teamGroupEmpty: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  onboardingFooter: { marginTop: "auto", paddingTop: 8 },
  onboardingFooterRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "white",
    alignItems: "center",
  },
  primaryButtonDisabled: { backgroundColor: "rgba(255,255,255,0.4)" },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: "#0B0F14", fontWeight: "800" },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  secondaryButtonPressed: { opacity: 0.8 },
  secondaryButtonText: { color: "white", fontWeight: "800" },

  settingsContent: { padding: 16, gap: 16, paddingBottom: 32 },
  settingsCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  settingsCardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  settingsToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingsToggleLabel: { color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleButtonOn: {
    backgroundColor: "white",
    borderColor: "white",
  },
  toggleButtonOff: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.3)",
  },
  toggleButtonPressed: { opacity: 0.8 },
  toggleButtonDisabled: { opacity: 0.4 },
  toggleButtonText: { fontWeight: "800", fontSize: 12, letterSpacing: 0.4 },
  toggleButtonTextOn: { color: "#0B0F14" },
  toggleButtonTextOff: { color: "rgba(255,255,255,0.75)" },
  refreshControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  refreshValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  refreshValueText: { color: "white", fontWeight: "800" },
  refreshHint: { color: "rgba(255,255,255,0.6)", fontWeight: "600" },
});
