import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
} from "react-native";
import AppHeader from "./src/components/AppHeader";

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
};

function makeMockCards(): ScoreCard[] {
  const nbaGames: Game[] = Array.from({ length: 14 }).map((_, i) => ({
    id: `nba-${i}`,
    time: i % 3 === 0 ? "LIVE" : i % 3 === 1 ? "7:30 PM" : "FINAL",
    awayTeam: ["Magic", "Celtics", "Lakers", "Heat"][i % 4],
    homeTeam: ["Knicks", "Bulls", "Warriors", "Nuggets"][i % 4],
    awayScore: i % 3 === 1 ? undefined : 80 + i,
    homeScore: i % 3 === 1 ? undefined : 78 + i,
    status: i % 3 === 0 ? "live" : i % 3 === 1 ? "scheduled" : "final",
  }));

  const nflGames: Game[] = Array.from({ length: 6 }).map((_, i) => ({
    id: `nfl-${i}`,
    time: i % 2 === 0 ? "1:00 PM" : "FINAL",
    awayTeam: ["Bucs", "Bills", "Eagles"][i % 3],
    homeTeam: ["Saints", "Jets", "Cowboys"][i % 3],
    awayScore: i % 2 === 0 ? undefined : 17 + i,
    homeScore: i % 2 === 0 ? undefined : 14 + i,
    status: i % 2 === 0 ? "scheduled" : "final",
  }));

  return [
    { id: "card-nba", title: "NBA", games: nbaGames },
    { id: "card-nfl", title: "NFL", games: nflGames },
  ];
}

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

export default function App() {
  const cards = useMemo(() => makeMockCards(), []);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader />

      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ScoreCardView card={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F14" },

  listContent: { padding: 16, paddingTop: 8, gap: 12 },

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
