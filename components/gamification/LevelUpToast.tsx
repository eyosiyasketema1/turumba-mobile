import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { ArrowUp, Star } from 'lucide-react-native';
import { tierColor } from '@/services/gamification';

interface LevelUpToastProps {
  visible: boolean;
  newLevel: number;
  tier: string;
  onHide: () => void;
}

export default function LevelUpToast({ visible, newLevel, tier, onHide }: LevelUpToastProps) {
  const slideY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const color = tierColor(tier);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideY, {
            toValue: -100,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideY }, { scale }],
          opacity,
          borderColor: color + '40',
          backgroundColor: color + '12',
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <ArrowUp size={16} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Level Up!</Text>
        <Text style={[styles.level, { color }]}>
          Level {newLevel} reached
        </Text>
      </View>
      <Star size={18} color={color} fill={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#1E293B',
  },
  level: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
});
