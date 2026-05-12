import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award, Star, Flame, Flag, Sparkles } from 'lucide-react-native';
import { rarityColor } from '@/services/gamification';

interface BadgeCardProps {
  name: string;
  description: string;
  category: 'achievement' | 'milestone' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  earned: boolean;
  earnedDate?: string;
  compact?: boolean;
}

const CATEGORY_ICON = {
  achievement: Award,
  milestone: Flag,
  streak: Flame,
  special: Sparkles,
};

const RARITY_LABEL: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export default function BadgeCard({
  name,
  description,
  category,
  rarity,
  xpReward,
  earned,
  earnedDate,
  compact = false,
}: BadgeCardProps) {
  const color = rarityColor(rarity);
  const IconComponent = CATEGORY_ICON[category] || Award;

  if (compact) {
    return (
      <View style={[styles.compactCard, { borderColor: earned ? color + '40' : '#E2E8F0' }]}>
        <View
          style={[
            styles.compactIcon,
            { backgroundColor: earned ? color + '18' : '#F1F5F9' },
          ]}
        >
          <IconComponent
            size={16}
            color={earned ? color : '#CBD5E1'}
            fill={earned && category === 'streak' ? color : 'none'}
          />
        </View>
        <View style={styles.compactText}>
          <Text
            style={[styles.compactName, { color: earned ? '#1E293B' : '#94A3B8' }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {earned && (
            <Text style={[styles.compactRarity, { color }]}>{RARITY_LABEL[rarity]}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: earned ? color + '40' : '#E2E8F0',
          backgroundColor: earned ? '#FFFFFF' : '#FAFAFA',
        },
      ]}
    >
      {/* Badge Icon */}
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: earned ? color + '15' : '#F1F5F9',
            borderColor: earned ? color + '30' : '#E2E8F0',
          },
        ]}
      >
        <IconComponent
          size={24}
          color={earned ? color : '#CBD5E1'}
          fill={earned && category === 'streak' ? color : 'none'}
        />
      </View>

      {/* Badge Info */}
      <Text
        style={[styles.name, { color: earned ? '#1E293B' : '#94A3B8' }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      {/* Rarity + XP */}
      <View style={styles.metaRow}>
        <View style={[styles.rarityPill, { backgroundColor: color + '15' }]}>
          <Star size={10} color={color} fill={rarity === 'legendary' ? color : 'none'} />
          <Text style={[styles.rarityText, { color }]}>{RARITY_LABEL[rarity]}</Text>
        </View>
        {xpReward > 0 && (
          <Text style={styles.xpReward}>+{xpReward} XP</Text>
        )}
      </View>

      {/* Earned date */}
      {earned && earnedDate && (
        <Text style={styles.earnedDate}>
          Earned {new Date(earnedDate).toLocaleDateString()}
        </Text>
      )}

      {/* Locked overlay */}
      {!earned && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>Locked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rarityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  xpReward: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#64748B',
  },
  earnedDate: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 8,
  },
  lockedText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: '#CBD5E1',
  },
  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    flex: 1,
  },
  compactName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  compactRarity: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },
});
