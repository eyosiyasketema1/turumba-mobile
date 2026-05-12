import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  UserCheck,
  Star,
  TrendingUp,
  Award,
  Flame,
  CheckCircle,
  ChevronRight,
  Mail,
  MailOpen,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { GamificationAPI, GamNotification } from '@/services/gamification';

const ACCOUNT_ID = 'tenant-1';
const ACTOR_ID = 'contact-2'; // Current mentor

// Map notification types to icons and colors
const NOTIF_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  mentor_nudge:         { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', label: 'Mentor Nudge' },
  seeker_needs_attention: { icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb', label: 'Needs Attention' },
  badge_earned:         { icon: Award, color: '#8b5cf6', bg: '#f5f3ff', label: 'Badge Earned' },
  level_up:             { icon: TrendingUp, color: '#10b981', bg: '#ecfdf5', label: 'Level Up' },
  streak_milestone:     { icon: Flame, color: '#f59e0b', bg: '#fffbeb', label: 'Streak' },
  milestone_completed:  { icon: Star, color: '#2563eb', bg: '#eff6ff', label: 'Milestone' },
  rank_change:          { icon: TrendingUp, color: '#06b6d4', bg: '#ecfeff', label: 'Rank Change' },
};

function getNotifConfig(type: string) {
  return NOTIF_CONFIG[type] || { icon: Bell, color: '#64748b', bg: '#f1f5f9', label: 'Notification' };
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [notifications, setNotifications] = useState<GamNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nudges' | 'achievements'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await GamificationAPI.getNotifications(ACTOR_ID, ACCOUNT_ID, 50);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await GamificationAPI.markAllNotificationsRead(ACCOUNT_ID, ACTOR_ID);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn('Failed to mark all read:', e);
    }
  };

  const handleNotificationTap = async (notif: GamNotification) => {
    // Mark as read
    if (!notif.is_read) {
      try {
        await GamificationAPI.markNotificationRead(notif.id);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
        );
      } catch (e) {
        console.warn('Failed to mark read:', e);
      }
    }

    // Navigate based on notification type
    if (notif.notification_type === 'mentor_nudge' || notif.notification_type === 'seeker_needs_attention') {
      const seekerId = notif.payload?.seeker_id || notif.payload?.actor_id;
      if (seekerId) {
        router.push(`/seeker/${seekerId}?tab=ai`);
      }
    } else if (notif.notification_type === 'badge_earned') {
      // Could navigate to badges view
    }
  };

  const safeNotifs = Array.isArray(notifications) ? notifications : [];

  const filtered = safeNotifs.filter(n => {
    if (filter === 'nudges') return n.notification_type === 'mentor_nudge' || n.notification_type === 'seeker_needs_attention';
    if (filter === 'achievements') return ['badge_earned', 'level_up', 'streak_milestone', 'milestone_completed', 'rank_change'].includes(n.notification_type);
    return true;
  });

  const unreadCount = safeNotifs.filter(n => !n.is_read).length;
  const nudgeCount = safeNotifs.filter(n =>
    !n.is_read && (n.notification_type === 'mentor_nudge' || n.notification_type === 'seeker_needs_attention')
  ).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.background }]}>
        {([
          { key: 'all' as const, label: 'All' },
          { key: 'nudges' as const, label: `Nudges${nudgeCount > 0 ? ` (${nudgeCount})` : ''}` },
          { key: 'achievements' as const, label: 'Achievements' },
        ]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.key ? colors.primary : colors.secondary },
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              { color: filter === f.key ? '#fff' : colors.mutedForeground },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Bell size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {filter === 'nudges' ? 'No mentor nudges yet' : 'No notifications yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            {filter === 'nudges'
              ? "When a seeker's engagement drops, you'll be notified here"
              : 'Badges, level-ups, and alerts will appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {filtered.map((notif) => {
            const config = getNotifConfig(notif.notification_type);
            const Icon = config.icon;
            const isNudge = notif.notification_type === 'mentor_nudge' || notif.notification_type === 'seeker_needs_attention';

            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: notif.is_read ? colors.card : config.bg,
                    borderLeftColor: isNudge && !notif.is_read ? config.color : 'transparent',
                    borderLeftWidth: isNudge && !notif.is_read ? 3 : 0,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleNotificationTap(notif)}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: config.bg }]}>
                  <Icon size={18} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                      {timeAgo(notif.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  {isNudge && (
                    <View style={styles.nudgeAction}>
                      <Text style={[styles.nudgeActionText, { color: colors.primary }]}>View seeker profile</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  )}
                </View>
                {!notif.is_read && (
                  <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 20 },
  headerBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: '#fff' },
  markAllText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  notifTime: { fontFamily: 'DMSans_400Regular', fontSize: 11 },
  notifTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, marginBottom: 2 },
  notifBody: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 },
  nudgeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  nudgeActionText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 8,
  },
});
