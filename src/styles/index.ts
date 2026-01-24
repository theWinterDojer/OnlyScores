import { StyleSheet } from 'react-native';

import { theme } from './theme';

export const useCardStyles = () =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.alpha.whiteTransparent(0.08),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    cardTitle: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
    cardTitleStack: { gap: 2 },
    cardActions: { alignItems: 'flex-end', gap: 8 },
    updatedText: {
      color: theme.alpha.whiteTransparent(0.55),
      fontSize: 12,
      fontWeight: '600',
    },
    linkText: { color: theme.alpha.whiteTransparent(0.75), fontWeight: '600' },
    dragHandle: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.alpha.whiteTransparent(0.12),
    },
    dragHandleText: {
      color: theme.alpha.whiteTransparent(0.85),
      fontSize: 12,
      fontWeight: '700',
    },
  });

export const useGameRowStyles = () =>
  StyleSheet.create({
    gameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.alpha.whiteTransparent(0.06),
    },
    gameLeft: { flex: 1, paddingRight: 12, gap: 6 },
    teamLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    teamInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    teamName: {
      fontWeight: '700',
      color: theme.colors.white,
      fontSize: 16,
      lineHeight: 20,
    },
    score: {
      fontWeight: '800',
      color: theme.colors.white,
      fontSize: 18,
      lineHeight: 22,
      minWidth: 28,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },
    logo: { width: 22, height: 22 },
    logoFallback: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.alpha.whiteTransparent(0.16),
    },
    logoFallbackText: {
      color: theme.colors.white,
      fontWeight: '700',
      fontSize: 12,
    },
    gameRight: { alignItems: 'flex-end', gap: 6 },
    timeText: { color: theme.alpha.whiteTransparent(0.75), fontWeight: '600' },
  });

export const useHeaderStyles = () =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    titleStack: { flex: 1 },
    appTitle: { color: theme.colors.white, fontSize: 28, fontWeight: '800' },
    subtitle: { color: theme.alpha.whiteTransparent(0.7), marginTop: 4 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.alpha.whiteTransparent(0.12),
    },
    headerButtonSecondary: {
      backgroundColor: theme.alpha.whiteTransparent(0.08),
    },
    headerButtonPressed: { opacity: 0.8 },
    headerButtonText: { color: theme.colors.white, fontWeight: '700', fontSize: 13 },
    headerButtonDisabled: { opacity: 0.5 },
    headerButtonTextDisabled: { color: theme.alpha.whiteTransparent(0.7) },
  });

export const usePillStyles = () =>
  StyleSheet.create({
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.alpha.whiteTransparent(0.1),
    },
    pillText: {
      color: theme.alpha.whiteTransparent(0.85),
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });
