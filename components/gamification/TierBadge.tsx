import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tierColor } from '@/services/gamification';
import { Shield } from 'lucide-react-native';

interface TierBadgeProps {
  tier: string;
  level: number;
  size?: 'small' | 'medium';
}

export default function TierBadge({ tier, level, size = 'small' }: TierBadgeProps) {
  const color = tierColor(tier);
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: color + '18', borderColor: color + '30' },
      isSmall ? styles.badgeSmall : styles.badgeMedium,
    ]}>
      <Shield size={isSmall ? 10 : 13} color={color} />
      <Text style={[
        styles.text,
        { color },
        isSmall ? styles.textSmall : styles.textMedium,
      ]}>
        L{level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: 'DMSans_700Bold',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
