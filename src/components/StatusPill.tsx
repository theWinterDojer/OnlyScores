import React from 'react';
import { Text, View } from 'react-native';

import { GameStatus } from '../types/score';
import { usePillStyles } from '../styles';

type StatusPillProps = {
  status: GameStatus;
};

export default function StatusPill({ status }: StatusPillProps) {
  const styles = usePillStyles();
  const label = status === 'scheduled' ? 'UPCOMING' : status.toUpperCase();
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}
