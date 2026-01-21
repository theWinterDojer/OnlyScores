import React from "react";
import { StyleSheet, Text, View } from "react-native";

import StatusPill from "./StatusPill";
import { Game } from "../types/score";

type GameRowProps = {
  game: Game;
};

export default function GameRow({ game }: GameRowProps) {
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

const styles = StyleSheet.create({
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
});
