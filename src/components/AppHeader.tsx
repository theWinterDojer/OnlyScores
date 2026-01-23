import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  secondaryActionDisabled?: boolean;
};

export default function AppHeader({
  title = "Only Scores",
  subtitle = "Just scores. Fast.",
  actionLabel,
  onActionPress,
  actionDisabled = false,
  secondaryActionLabel,
  onSecondaryActionPress,
  secondaryActionDisabled = false,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleStack}>
        <Text style={styles.appTitle}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerActions}>
        {secondaryActionLabel && onSecondaryActionPress ? (
          <Pressable
            onPress={onSecondaryActionPress}
            hitSlop={10}
            disabled={secondaryActionDisabled}
            style={({ pressed }) => [
              styles.headerButton,
              styles.headerButtonSecondary,
              pressed ? styles.headerButtonPressed : null,
              secondaryActionDisabled ? styles.headerButtonDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.headerButtonText,
                secondaryActionDisabled ? styles.headerButtonTextDisabled : null,
              ]}
            >
              {secondaryActionLabel}
            </Text>
          </Pressable>
        ) : null}
        {actionLabel && onActionPress ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={10}
            disabled={actionDisabled}
            style={({ pressed }) => [
              styles.headerButton,
              pressed ? styles.headerButtonPressed : null,
              actionDisabled ? styles.headerButtonDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.headerButtonText,
                actionDisabled ? styles.headerButtonTextDisabled : null,
              ]}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerButtonPressed: { opacity: 0.8 },
  headerButtonText: { color: "white", fontWeight: "700", fontSize: 13 },
  headerButtonDisabled: { opacity: 0.5 },
  headerButtonTextDisabled: { color: "rgba(255,255,255,0.7)" },
});
