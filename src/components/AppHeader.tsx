import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.appTitle}>Only Scores</Text>
      <Text style={styles.subtitle}>Just scores. Fast.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  appTitle: { color: "white", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.7)", marginTop: 4 },
});
