import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ViewProps } from 'react-native';

import { useCardStyles } from '../styles';
import GameRow from './GameRow';
import { ScoreCard } from '../types/score';

type ScoreCardViewProps = {
  card: ScoreCard;
  dragHandleProps?: ViewProps;
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

const formatUpdatedLabel = (timestamp?: string) => {
  if (!timestamp) return 'Updated --';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Updated --';
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `Updated ${normalizedHours}:${minutes} ${period}`;
};

export default function ScoreCardView({
  card,
  dragHandleProps,
  expanded = false,
  onToggleExpanded,
}: ScoreCardViewProps) {
  const visibleGames = useMemo(() => {
    if (expanded) return card.games;
    return card.games.slice(0, 10);
  }, [expanded, card.games]);

  const overflow = card.games.length > 10;

  const styles = useCardStyles();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleStack}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.updatedText}>{formatUpdatedLabel(card.lastUpdated)}</Text>
        </View>

        <View style={styles.cardActions}>
          {overflow ? (
            <Pressable onPress={onToggleExpanded} hitSlop={10}>
              <Text style={styles.linkText}>
                {expanded ? 'Show less' : `Show more (${card.games.length - 10})`}
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
