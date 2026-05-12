import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { tierColor } from '@/services/gamification';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  xpEarned: number;
  tier?: string;
  level?: number;
  isCurrentUser?: boolean;
  previousRank?: number;
}

const MEDAL_COLORS: Record<number, string> = {
  1: '#f59e0b', // gold
  2: '#94a3b8', // silver
  3: '#d97706', // bronze
};

export default function LeaderboardRow({
  rank,
  name,
  xpEarned,
  tier = 'bronze',
  level,
  isCurrentUser = false,
  previousRank,
}: LeaderboardRowProps) {
  const isMedal = rank <= 3;
  const medalColor = MEDAL_COLORS[rank];
  const color = tierColor(tier);

  // Rank change indicator
  const rankDelta = previousRank ? previousRank - rank : 0;

  return (
    <View
      style={[
        styles.row,
        isCurrentUser && styles.currentUserRow,
        isCurrentUser && { borderColor: color + '40' },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        {isMedal ? (
          <View style={[styles.medalCircle, { backgroundColor: medalColor + '18' }]}>
            <Medal size={16} color={medalColor} />
          </View>
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>

      {/* Avatar + Name */}
      <View style={styles.nameContainer}>
        <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
          <Text style={[styles.avatarText, { color }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.name, isCurrentUser && { color }]} numberOfLines={1}>
            {name}
            {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
          </Text>
          {level !== undefined && (
            <Text style={styles.levelLabel}>Level {level}</Text>
          )}
        </View>
      </View>

      {/* XP + Rank Change */}
      <View style={styles.xpContainer}>
        <Text style={[styles.xpText, isMedal && { color: medalColor }]}>
          {xpEarned.toLocaleString()} <Text style={styles.xpLabel}>XP</Text>
        </Text>
        {rankDelta !== 0 && (
          <View style={styles.deltaRow}>
            {rankDelta > 0 ? (
              <>
                <TrendingUp size={10} color="#10b981" />
                <Text style={styles.deltaUp}>+{rankDelta}</Text>
              </>
            ) : (
              <>
                <TrendingDown size={10} color="#ef4444" />
                <Text style={styles.deltaDown}>{rankDelta}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  currentUserRow: {
    backgroundColor: '#FAFBFF',
    borderWidth: 1.5,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#94A3B8',
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#1E293B',
  },
  youBadge: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  levelLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  xpContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  xpText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  xpLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deltaUp: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#10b981',
  },
  deltaDown: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#ef4444',
  },
});
