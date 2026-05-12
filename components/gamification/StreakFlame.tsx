import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';

interface StreakFlameProps {
  currentStreak: number;
  longestStreak?: number;
  compact?: boolean;
}

export default function StreakFlame({ currentStreak, longestStreak, compact = false }: StreakFlameProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse animation when streak is active
  useEffect(() => {
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStreak]);

  // Color intensity based on streak length
  const flameColor = currentStreak >= 30
    ? '#dc2626' // red for 30+
    : currentStreak >= 14
    ? '#f97316' // orange for 14+
    : currentStreak >= 7
    ? '#f59e0b' // amber for 7+
    : currentStreak > 0
    ? '#fbbf24' // yellow for 1+
    : '#CBD5E1'; // gray for 0

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View style={{ transform: [{ scale: currentStreak > 0 ? pulseAnim : 1 }] }}>
          <Flame size={16} color={flameColor} fill={currentStreak > 0 ? flameColor : 'none'} />
        </Animated.View>
        <Text style={[styles.compactText, { color: currentStreak > 0 ? '#1E293B' : '#94A3B8' }]}>
          {currentStreak}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.flameWrapper, { opacity: glowAnim }]}>
        <View style={[styles.glowCircle, { backgroundColor: flameColor }]} />
      </Animated.View>

      <Animated.View style={[styles.flameIcon, { transform: [{ scale: currentStreak > 0 ? pulseAnim : 1 }] }]}>
        <Flame size={28} color={flameColor} fill={currentStreak > 0 ? flameColor : 'none'} />
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.streakCount}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>
          {currentStreak === 1 ? 'day streak' : 'day streak'}
        </Text>
      </View>

      {longestStreak !== undefined && longestStreak > currentStreak && (
        <Text style={styles.bestStreak}>Best: {longestStreak} days</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  flameWrapper: {
    position: 'absolute',
    top: 4,
  },
  glowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.15,
  },
  flameIcon: {
    marginBottom: 6,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakCount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: '#1E293B',
  },
  streakLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#64748B',
  },
  bestStreak: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
});
