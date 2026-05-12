import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { xpProgress, tierColor } from '@/services/gamification';

interface XpProgressBarProps {
  totalXp: number;
  level: number;
  tier: string;
  compact?: boolean;
}

export default function XpProgressBar({ totalXp, level, tier, compact = false }: XpProgressBarProps) {
  const { currentLevelXp, nextLevelXp, progressPct } = xpProgress(totalXp, level);
  const animWidth = useRef(new Animated.Value(0)).current;
  const color = tierColor(tier);

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progressPct,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  const barWidth = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactLabelRow}>
          <Text style={[styles.compactLevel, { color }]}>Lv {level}</Text>
          <Text style={styles.compactXp}>{totalXp} XP</Text>
        </View>
        <View style={styles.compactBarBg}>
          <Animated.View style={[styles.compactBarFill, { width: barWidth, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.levelBadge}>
          <View style={[styles.levelCircle, { backgroundColor: color }]}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
          <Text style={[styles.tierLabel, { color }]}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Text>
        </View>
        <Text style={styles.xpText}>
          {totalXp.toLocaleString()} XP
        </Text>
      </View>

      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: color }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.rangeText}>{currentLevelXp} XP</Text>
        <Text style={styles.rangeText}>{nextLevelXp} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  tierLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  xpText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  // Compact variant
  compactContainer: {
    gap: 4,
  },
  compactLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLevel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  compactXp: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  compactBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
