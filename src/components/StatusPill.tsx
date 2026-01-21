import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { GameStatus } from "../types/score";

type StatusPillProps = {
  status: GameStatus;
};

export default function StatusPill({ status }: StatusPillProps) {
  const label = status === "scheduled" ? "UPCOMING" : status.toUpperCase();
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
