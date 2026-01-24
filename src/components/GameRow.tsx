import React from 'react';
import { Image, Text, View } from 'react-native';

import { useGameRowStyles } from '../styles';
import StatusPill from './StatusPill';
import { Game } from '../types/score';

type GameRowProps = {
  game: Game;
};

const getLogoFallback = (teamName: string) => {
  const trimmed = teamName.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

export default function GameRow({ game }: GameRowProps) {
  const styles = useGameRowStyles();
  const showScores = game.status !== 'scheduled';
  return (
    <View style={styles.gameRow}>
      <View style={styles.gameLeft}>
        <View style={styles.teamLine}>
          <View style={styles.teamInfo}>
            {game.awayLogoUrl ? (
              <Image source={{ uri: game.awayLogoUrl }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{getLogoFallback(game.awayTeam)}</Text>
              </View>
            )}
            <Text style={styles.teamName}>{game.awayTeam}</Text>
          </View>
          <Text style={styles.score}>{showScores ? (game.awayScore ?? '-') : '-'}</Text>
        </View>
        <View style={styles.teamLine}>
          <View style={styles.teamInfo}>
            {game.homeLogoUrl ? (
              <Image source={{ uri: game.homeLogoUrl }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{getLogoFallback(game.homeTeam)}</Text>
              </View>
            )}
            <Text style={styles.teamName}>{game.homeTeam}</Text>
          </View>
          <Text style={styles.score}>{showScores ? (game.homeScore ?? '-') : '-'}</Text>
        </View>
      </View>

      <View style={styles.gameRight}>
        <StatusPill status={game.status} />
        <Text style={styles.timeText}>{game.time}</Text>
      </View>
    </View>
  );
}
