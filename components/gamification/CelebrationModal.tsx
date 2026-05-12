import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Modal, Pressable, Dimensions,
} from 'react-native';
import { Award, Star, Flag, Sparkles, Flame, X, ChevronRight } from 'lucide-react-native';
import { rarityColor } from '@/services/gamification';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────

export type CelebrationEvent =
  | { type: 'badge_earned'; badgeName: string; rarity: string; category: string; xpReward: number; description: string }
  | { type: 'level_up'; newLevel: number; tier: string }
  | { type: 'milestone_completed'; milestoneName: string };

interface CelebrationModalProps {
  queue: CelebrationEvent[];
  onDismiss: () => void;
}

// ─── Confetti Particle ──────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#f59e0b', '#a855f7', '#3b82f6', '#10b981', '#ef4444', '#ec4899'];

function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const startX = Math.random() * SCREEN_W;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 6;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H * 0.7,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 4 + Math.random() * 4,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2500,
          delay: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 8],
                outputRange: ['0deg', '2880deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

// ─── Category Icon ──────────────────────────────────────────────────────────

function CategoryIcon({ category, color, size }: { category: string; color: string; size: number }) {
  switch (category) {
    case 'milestone': return <Flag size={size} color={color} />;
    case 'streak': return <Flame size={size} color={color} fill={color} />;
    case 'special': return <Sparkles size={size} color={color} />;
    default: return <Award size={size} color={color} />;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CelebrationModal({ queue, onDismiss }: CelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const event = queue[0];
  const hasMore = queue.length > 1;

  useEffect(() => {
    if (!event) return;

    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [event]);

  if (!event) return null;

  // Derive display values
  let title = '';
  let subtitle = '';
  let accentColor = '#3b82f6';
  let category = 'achievement';

  if (event.type === 'badge_earned') {
    title = event.badgeName;
    subtitle = event.description;
    accentColor = rarityColor(event.rarity);
    category = event.category;
  } else if (event.type === 'level_up') {
    title = `Level ${event.newLevel}!`;
    subtitle = 'You reached a new level';
    accentColor = '#10b981';
    category = 'special';
  } else if (event.type === 'milestone_completed') {
    title = event.milestoneName;
    subtitle = 'Milestone completed!';
    accentColor = '#a855f7';
    category = 'milestone';
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} delay={i * 60} />
      ))}

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={styles.backdropPress} onPress={onDismiss} />

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Close */}
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={12}>
            <X size={18} color="#94A3B8" />
          </Pressable>

          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: accentColor,
                opacity: glowAnim,
              },
            ]}
          />

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
            <CategoryIcon category={category} color={accentColor} size={36} />
          </View>

          {/* Title */}
          <Text style={styles.celebTitle}>{title}</Text>
          <Text style={styles.celebSubtitle}>{subtitle}</Text>

          {/* XP reward badge */}
          {event.type === 'badge_earned' && event.xpReward > 0 && (
            <View style={[styles.xpBadge, { backgroundColor: accentColor + '15' }]}>
              <Star size={12} color={accentColor} fill={accentColor} />
              <Text style={[styles.xpBadgeText, { color: accentColor }]}>
                +{event.xpReward} XP
              </Text>
            </View>
          )}

          {/* Rarity label for badges */}
          {event.type === 'badge_earned' && (
            <View style={[styles.rarityTag, { borderColor: accentColor + '30' }]}>
              <Text style={[styles.rarityTagText, { color: accentColor }]}>
                {event.rarity.charAt(0).toUpperCase() + event.rarity.slice(1)} Badge
              </Text>
            </View>
          )}

          {/* Dismiss / Next */}
          <Pressable
            style={[styles.dismissBtn, { backgroundColor: accentColor }]}
            onPress={onDismiss}
          >
            <Text style={styles.dismissText}>
              {hasMore ? 'Next' : 'Awesome!'}
            </Text>
            {hasMore && <ChevronRight size={16} color="#fff" />}
          </Pressable>

          {hasMore && (
            <Text style={styles.queueHint}>
              +{queue.length - 1} more {queue.length - 1 === 1 ? 'celebration' : 'celebrations'}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: SCREEN_W * 0.82,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  glowRing: {
    position: 'absolute',
    top: -8,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignSelf: 'center',
    marginTop: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  celebTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  celebSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  xpBadgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  rarityTag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 16,
  },
  rarityTagText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  dismissText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  queueHint: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    zIndex: 9999,
  },
});
