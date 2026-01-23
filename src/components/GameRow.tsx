import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import StatusPill from "./StatusPill";
import { Game } from "../types/score";

type GameRowProps = {
  game: Game;
};

const getLogoFallback = (teamName: string) => {
  const trimmed = teamName.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

export default function GameRow({ game }: GameRowProps) {
  const showScores = game.status !== "scheduled";
  return (
    <View style={styles.gameRow}>
      <View style={styles.gameLeft}>
        <View style={styles.teamLine}>
          <View style={styles.teamInfo}>
            {game.awayLogoUrl ? (
              <Image
                source={{ uri: game.awayLogoUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>
                  {getLogoFallback(game.awayTeam)}
                </Text>
              </View>
            )}
            <Text style={styles.teamName}>{game.awayTeam}</Text>
          </View>
          <Text style={styles.score}>
            {showScores ? game.awayScore ?? "-" : "-"}
          </Text>
        </View>
        <View style={styles.teamLine}>
          <View style={styles.teamInfo}>
            {game.homeLogoUrl ? (
              <Image
                source={{ uri: game.homeLogoUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>
                  {getLogoFallback(game.homeTeam)}
                </Text>
              </View>
            )}
            <Text style={styles.teamName}>{game.homeTeam}</Text>
          </View>
          <Text style={styles.score}>
            {showScores ? game.homeScore ?? "-" : "-"}
          </Text>
        </View>
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
  gameLeft: { flex: 1, paddingRight: 12, gap: 6 },
  teamLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamName: {
    fontWeight: "700",
    color: "white",
    fontSize: 16,
    lineHeight: 20,
  },
  score: {
    fontWeight: "800",
    color: "white",
    fontSize: 18,
    lineHeight: 22,
    minWidth: 28,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  logo: { width: 22, height: 22 },
  logoFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  logoFallbackText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  gameRight: { alignItems: "flex-end", gap: 6 },
  timeText: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },
});
