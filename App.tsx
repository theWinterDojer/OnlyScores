import React, { useMemo } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
} from "react-native";
import ScoreCardView, {
  Game,
  ScoreCard,
} from "./src/components/ScoreCardView";

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

export default function App() {
  const cards = useMemo(() => makeMockCards(), []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Only Scores</Text>
        <Text style={styles.subtitle}>Just scores. Fast.</Text>
      </View>

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
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  appTitle: { color: "white", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.7)", marginTop: 4 },

  listContent: { padding: 16, paddingTop: 8, gap: 12 },
});
