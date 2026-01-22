import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function AppHeader({
  title = "Only Scores",
  subtitle = "Just scores. Fast.",
  actionLabel,
  onActionPress,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleStack}>
        <Text style={styles.appTitle}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerButton,
            pressed ? styles.headerButtonPressed : null,
          ]}
        >
          <Text style={styles.headerButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleStack: { flex: 1 },
  appTitle: { color: "white", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.7)", marginTop: 4 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerButtonPressed: { opacity: 0.8 },
  headerButtonText: { color: "white", fontWeight: "700", fontSize: 13 },
});
