import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type GameStatus = "scheduled" | "live" | "final";

export type Game = {
  id: string;
  time: string; // e.g., "7:30 PM"
  awayTeam: string;
  homeTeam: string;
  awayScore?: number;
  homeScore?: number;
  status: GameStatus;
};

export type ScoreCard = {
  id: string;
  title: string; // e.g., "NBA"
  games: Game[];
};

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

export default function ScoreCardView({ card }: { card: ScoreCard }) {
  const [expanded, setExpanded] = useState(false);

  const visibleGames = useMemo(() => {
    if (expanded) return card.games;
    return card.games.slice(0, 10);
  }, [expanded, card.games]);

  const overflow = card.games.length > 10;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{card.title}</Text>

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
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
