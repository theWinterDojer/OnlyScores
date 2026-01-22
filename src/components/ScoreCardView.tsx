import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ViewProps } from "react-native";

import GameRow from "./GameRow";
import { ScoreCard } from "../types/score";

type ScoreCardViewProps = {
  card: ScoreCard;
  dragHandleProps?: ViewProps;
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

export default function ScoreCardView({
  card,
  dragHandleProps,
}: ScoreCardViewProps) {
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

        <View style={styles.cardActions}>
          {overflow ? (
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={10}>
              <Text style={styles.linkText}>
                {expanded
                  ? "Show less"
                  : `Show more (${card.games.length - 10})`}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.dragHandle} {...dragHandleProps}>
            <Text style={styles.dragHandleText}>Drag</Text>
          </View>
        </View>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  cardTitleStack: { gap: 2 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  updatedText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
  },
  linkText: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  dragHandle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dragHandleText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
  },
});
