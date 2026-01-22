import { Alert } from "react-native";

import { readCache, writeCache } from "../providers/cache";
import { ScoreCard, Game } from "../types/score";
import {
  CardNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  NotificationPrefsByCard,
} from "../types/notifications";

const PUSH_TOKEN_CACHE_KEY = "notifications:deviceToken";

export type NotificationEventType = "start" | "score" | "final";

export type NotificationEvent = {
  type: NotificationEventType;
  cardId: string;
  gameId: string;
  title: string;
  body: string;
};

export const configureNotifications = async () => {
  return;
};

export const ensureNotificationPermissions = async () => {
  // Placeholder until native push permissions are wired in.
  return true;
};

export const getCachedPushToken = async () =>
  readCache<string>(PUSH_TOKEN_CACHE_KEY);

export const fetchExpoPushToken = async () => {
  const cached = await readCache<string>(PUSH_TOKEN_CACHE_KEY);
  if (cached) return cached;
  // Temporary local token for subscription flow when push is not wired.
  const generated = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await writeCache(PUSH_TOKEN_CACHE_KEY, generated);
  return generated;
};

const formatScoreValue = (value?: number) =>
  value === undefined ? "-" : String(value);

const formatScoreLine = (game: Game) =>
  `${game.awayTeam} ${formatScoreValue(game.awayScore)} - ${game.homeTeam} ${formatScoreValue(
    game.homeScore
  )}`;

const buildNotificationEvent = (
  type: NotificationEventType,
  cardId: string,
  game: Game
): NotificationEvent => {
  const matchup = `${game.awayTeam} at ${game.homeTeam}`;
  const scoreLine = formatScoreLine(game);
  if (type === "start") {
    return {
      type,
      cardId,
      gameId: game.id,
      title: matchup,
      body: "Game started.",
    };
  }
  if (type === "final") {
    return {
      type,
      cardId,
      gameId: game.id,
      title: matchup,
      body: `Final: ${scoreLine}`,
    };
  }
  return {
    type,
    cardId,
    gameId: game.id,
    title: matchup,
    body: scoreLine,
  };
};

const hasScoreChanged = (prev: Game, next: Game) =>
  prev.awayScore !== next.awayScore || prev.homeScore !== next.homeScore;

const shouldNotifyGame = (
  prev: Game,
  next: Game,
  prefs: CardNotificationPrefs,
  cardId: string
): NotificationEvent | null => {
  const started = prev.status === "scheduled" && next.status === "live";
  const finished = prev.status !== "final" && next.status === "final";
  const scoreChanged = hasScoreChanged(prev, next);

  if (finished && prefs.notifyFinal) {
    return buildNotificationEvent("final", cardId, next);
  }
  if (started && prefs.notifyStart) {
    return buildNotificationEvent("start", cardId, next);
  }
  if (scoreChanged && prefs.notifyScore) {
    return buildNotificationEvent("score", cardId, next);
  }
  return null;
};

export const buildNotificationEvents = (
  prevCards: ScoreCard[],
  nextCards: ScoreCard[],
  prefsByCard: NotificationPrefsByCard
) => {
  const previousById = new Map(prevCards.map((card) => [card.id, card]));
  const events: NotificationEvent[] = [];

  nextCards.forEach((card) => {
    const prefs = prefsByCard[card.id] ?? DEFAULT_NOTIFICATION_PREFS;
    if (!prefs.notifyStart && !prefs.notifyScore && !prefs.notifyFinal) return;
    const prevCard = previousById.get(card.id);
    if (!prevCard) return;
    const prevGames = new Map(prevCard.games.map((game) => [game.id, game]));
    card.games.forEach((game) => {
      const prevGame = prevGames.get(game.id);
      if (!prevGame) return;
      const event = shouldNotifyGame(prevGame, game, prefs, card.id);
      if (event) {
        events.push(event);
      }
    });
  });

  return events;
};

export const deliverNotificationEvents = async (events: NotificationEvent[]) => {
  if (events.length === 0) return;
  events.forEach((event) => {
    Alert.alert(event.title, event.body);
  });
};
