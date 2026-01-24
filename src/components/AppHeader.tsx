import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useHeaderStyles } from '../styles';

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
  title = 'Only Scores',
  subtitle = 'Just scores. Fast.',
  actionLabel,
  onActionPress,
  actionDisabled = false,
  secondaryActionLabel,
  onSecondaryActionPress,
  secondaryActionDisabled = false,
}: AppHeaderProps) {
  const styles = useHeaderStyles();
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
