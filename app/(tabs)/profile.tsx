import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Mail,
  Phone,
  Building2,
  Globe,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  Check,
  Trophy,
  Award,
  Medal,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { isApiConfigured } from '@/services/api';
import {
  GamificationAPI,
  xpProgress,
  tierColor,
  tierLabel,
  rarityColor,
  type GamificationProfile,
  type BadgeAward,
  type LeaderboardEntry,
  type PointsSummary,
} from '@/services/gamification';
import XpProgressBar from '@/components/gamification/XpProgressBar';
import TierBadge from '@/components/gamification/TierBadge';
import StreakFlame from '@/components/gamification/StreakFlame';
import BadgeCard from '@/components/gamification/BadgeCard';
import StreakCalendar from '@/components/gamification/StreakCalendar';
import { useCelebrations } from '@/components/gamification/CelebrationContext';
import type { CelebrationEvent } from '@/components/gamification/CelebrationModal';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * The backend exposes current_streak / longest_streak / last_activity_at but
 * not a per-day activity history. To populate the StreakCalendar visually we
 * synthesize the most recent N days as active where N = current_streak,
 * anchored at last_activity_at (or today if not set).
 *
 * Once a real activity-history endpoint exists, swap this for those records.
 */
function deriveActiveDays(currentStreak: number, lastActivityAt: string | null): string[] {
  if (!currentStreak || currentStreak <= 0) return [];
  const anchor = lastActivityAt ? new Date(lastActivityAt) : new Date();
  if (Number.isNaN(anchor.getTime())) return [];
  const days: string[] = [];
  const cursor = new Date(anchor);
  for (let i = 0; i < currentStreak; i++) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

// ─── Mentor Profile Data ──────────────────────────────────────────────────

const MENTOR_PROFILE = {
  name: 'Samson Usmael',
  initials: 'SU',
  color: '#2563eb',
  role: 'Digital Mentor',
  email: 'samson.usmael@gcmethiopia.org',
  phone: '+251 91 456 7890',
  organization: 'GCM Ethiopia',
  language: 'English',
  location: 'Addis Ababa, Ethiopia',
  joinedDate: 'Sep 2024',
  stats: {
    totalSeekers: 12,
    activeSeekers: 8,
    avgEngagement: 78,
    completionRate: 67,
  },
};

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [language, setLanguage] = useState('English');

  // Gamification state
  const [gamProfile, setGamProfile] = useState<GamificationProfile | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeAward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gamLoading, setGamLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Celebration queue + refs tracking what we've already celebrated, so we
  // only enqueue events for *new* badges / level-ups, not the existing state
  // present on first load.
  const { enqueue } = useCelebrations();
  const seenBadgeIdsRef = useRef<Set<string> | null>(null);
  const seenLevelRef = useRef<number | null>(null);

  // Fetch gamification data
  const ACCOUNT_ID = 'tenant-1';
  const ACTOR_ID = 'contact-2'; // Current mentor actor — swap for real user ID

  const loadGamification = useCallback(async (opts: { isRefresh?: boolean } = {}) => {
    if (!isApiConfigured()) {
      setGamLoading(false);
      setRefreshing(false);
      return;
    }

    if (opts.isRefresh) setRefreshing(true);

    const [profileRes, summaryRes, badgesRes, lbRes] = await Promise.allSettled([
      GamificationAPI.getProfile(ACTOR_ID, ACCOUNT_ID),
      GamificationAPI.getPointsSummary(ACTOR_ID, ACCOUNT_ID),
      GamificationAPI.getAwardedBadges(ACTOR_ID, ACCOUNT_ID),
      GamificationAPI.getLeaderboard(ACCOUNT_ID, 'weekly', undefined, 5),
    ]);

    const nextProfile =
      profileRes.status === 'fulfilled' && profileRes.value.data
        ? profileRes.value.data
        : null;
    const nextBadges =
      badgesRes.status === 'fulfilled' && badgesRes.value.data
        ? badgesRes.value.data
        : [];

    // ─── Detect new badges / level-ups and enqueue celebrations ───────────
    const events: CelebrationEvent[] = [];

    if (seenBadgeIdsRef.current === null) {
      // First load: just record the baseline, don't celebrate existing badges.
      seenBadgeIdsRef.current = new Set(nextBadges.map((b) => b.id));
    } else {
      const seen = seenBadgeIdsRef.current;
      for (const award of nextBadges) {
        if (!seen.has(award.id)) {
          seen.add(award.id);
          events.push({
            type: 'badge_earned',
            badgeName: award.badge.name,
            description: award.badge.description,
            category: award.badge.category,
            rarity: award.badge.rarity,
            xpReward: award.badge.xp_reward,
          });
        }
      }
    }

    if (nextProfile) {
      if (seenLevelRef.current === null) {
        seenLevelRef.current = nextProfile.level;
      } else if (nextProfile.level > seenLevelRef.current) {
        // Emit one level_up event per level crossed (handles multi-level jumps).
        for (let lvl = seenLevelRef.current + 1; lvl <= nextProfile.level; lvl++) {
          events.push({ type: 'level_up', newLevel: lvl, tier: nextProfile.tier });
        }
        seenLevelRef.current = nextProfile.level;
      }
    }

    if (events.length > 0) enqueue(events);

    // ─── Commit data ──────────────────────────────────────────────────────
    if (nextProfile) setGamProfile(nextProfile);
    if (summaryRes.status === 'fulfilled' && summaryRes.value.data)
      setPointsSummary(summaryRes.value.data);
    setEarnedBadges(nextBadges);
    if (lbRes.status === 'fulfilled' && lbRes.value.data)
      setLeaderboard(lbRes.value.data);

    setGamLoading(false);
    setRefreshing(false);
  }, [enqueue]);

  useEffect(() => {
    loadGamification();
  }, [loadGamification]);

  const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ' },
    { code: 'om', name: 'Afaan Oromoo', native: 'Afaan Oromoo' },
    { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
  ];

  const profile = MENTOR_PROFILE;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGamification({ isRefresh: true })}
            tintColor={colors.primary}
          />
        }
      >
        {/* Identity Block */}
        <View style={styles.identityBlock}>
          <View style={[styles.avatar, { backgroundColor: profile.color }]}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>{profile.role}</Text>
          <View style={[styles.orgBadge, { backgroundColor: colors.secondary }]}>
            <Building2 size={12} color={colors.mutedForeground} />
            <Text style={[styles.orgText, { color: colors.foreground }]}>{profile.organization}</Text>
          </View>
        </View>


        {/* ─── Gamification Section ─────────────────────────────────────── */}
        {gamLoading ? (
          <View style={[styles.section, { alignItems: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : gamProfile ? (
          <>
            {/* XP & Level Card */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GAMIFICATION</Text>
              <View style={[styles.card, { borderColor: colors.border, padding: 16 }]}>
                {/* Tier + Level row */}
                <View style={gamStyles.topRow}>
                  <TierBadge tier={gamProfile.tier} level={gamProfile.level} size="medium" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[gamStyles.levelText, { color: colors.foreground }]}>
                      Level {gamProfile.level}
                    </Text>
                    <Text style={[gamStyles.tierText, { color: tierColor(gamProfile.tier) }]}>
                      {tierLabel(gamProfile.tier)} Tier
                    </Text>
                  </View>
                  <StreakFlame currentStreak={gamProfile.current_streak} longestStreak={gamProfile.longest_streak} />
                </View>

                {/* XP Progress */}
                <View style={{ marginTop: 14 }}>
                  <XpProgressBar
                    totalXp={gamProfile.total_xp}
                    level={gamProfile.level}
                    tier={gamProfile.tier}
                  />
                </View>

                {/* XP Stats Row */}
                {pointsSummary && (
                  <View style={gamStyles.statsRow}>
                    <View style={gamStyles.statItem}>
                      <Text style={[gamStyles.statValue, { color: colors.foreground }]}>
                        {gamProfile.total_xp.toLocaleString()}
                      </Text>
                      <Text style={[gamStyles.statLabel, { color: colors.mutedForeground }]}>Total XP</Text>
                    </View>
                    <View style={[gamStyles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={gamStyles.statItem}>
                      <Text style={[gamStyles.statValue, { color: colors.foreground }]}>
                        {pointsSummary.this_week}
                      </Text>
                      <Text style={[gamStyles.statLabel, { color: colors.mutedForeground }]}>This Week</Text>
                    </View>
                    <View style={[gamStyles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={gamStyles.statItem}>
                      <Text style={[gamStyles.statValue, { color: colors.foreground }]}>
                        {gamProfile.current_streak}
                      </Text>
                      <Text style={[gamStyles.statLabel, { color: colors.mutedForeground }]}>Day Streak</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Streak Calendar */}
            <View style={styles.section}>
              <View style={gamStyles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>
                  STREAK
                </Text>
                {gamProfile.longest_streak > 0 && (
                  <View style={gamStyles.badgeCount}>
                    <Text style={[gamStyles.badgeCountText, { color: colors.primary }]}>
                      Best {gamProfile.longest_streak}d
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.card, { borderColor: colors.border, padding: 14, marginTop: 10 }]}>
                <StreakCalendar
                  activeDays={deriveActiveDays(gamProfile.current_streak, gamProfile.last_activity_at)}
                  weeks={12}
                  tier={gamProfile.tier}
                />
              </View>
            </View>

            {/* Dev-only: trigger sample celebrations. Remove before shipping. */}
            {__DEV__ && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.card, { borderColor: colors.border, padding: 14, alignItems: 'center' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    enqueue([
                      {
                        type: 'badge_earned',
                        badgeName: 'First Steps',
                        description: 'You completed your first action — welcome aboard!',
                        category: 'achievement',
                        rarity: 'common',
                        xpReward: 50,
                      },
                      {
                        type: 'level_up',
                        newLevel: (gamProfile.level ?? 1) + 1,
                        tier: gamProfile.tier ?? 'bronze',
                      },
                      {
                        type: 'badge_earned',
                        badgeName: 'Streak Keeper',
                        description: 'Maintained a 7-day activity streak',
                        category: 'streak',
                        rarity: 'rare',
                        xpReward: 150,
                      },
                      {
                        type: 'milestone_completed',
                        milestoneName: 'Salvation Decision',
                      },
                    ]);
                  }}
                >
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.primary }}>
                    🎉 Preview celebration queue (dev)
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>
                    Fires 4 sample events — tap Next to advance
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Badges */}
            {earnedBadges.length > 0 && (
              <View style={styles.section}>
                <View style={gamStyles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>
                    BADGES EARNED
                  </Text>
                  <View style={gamStyles.badgeCount}>
                    <Text style={[gamStyles.badgeCountText, { color: colors.primary }]}>
                      {earnedBadges.length}
                    </Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 10 }}
                >
                  {earnedBadges.map((award) => (
                    <BadgeCard
                      key={award.id}
                      name={award.badge.name}
                      description={award.badge.description}
                      category={award.badge.category}
                      rarity={award.badge.rarity}
                      xpReward={award.badge.xp_reward}
                      earned
                      earnedDate={award.awarded_at}
                      compact
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Mini Leaderboard */}
            {leaderboard.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WEEKLY LEADERBOARD</Text>
                <View style={[styles.card, { borderColor: colors.border }]}>
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.actor_id === ACTOR_ID;
                    const medalColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#d97706' };
                    const medalColor = medalColors[entry.rank];
                    return (
                      <View
                        key={entry.id}
                        style={[
                          gamStyles.lbRow,
                          i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
                          isMe && { backgroundColor: colors.primary + '08' },
                        ]}
                      >
                        {entry.rank <= 3 ? (
                          <View style={[gamStyles.medalCircle, { backgroundColor: medalColor + '18' }]}>
                            <Medal size={14} color={medalColor!} />
                          </View>
                        ) : (
                          <Text style={[gamStyles.lbRank, { color: colors.mutedForeground }]}>
                            {entry.rank}
                          </Text>
                        )}
                        <View style={[gamStyles.lbAvatar, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[gamStyles.lbAvatarText, { color: colors.primary }]}>
                            {entry.actor_id.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[gamStyles.lbName, { color: colors.foreground }]} numberOfLines={1}>
                            {entry.actor_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            {isMe ? ' (You)' : ''}
                          </Text>
                        </View>
                        <Text style={[gamStyles.lbXp, { color: medalColor || colors.foreground }]}>
                          {entry.xp_earned} <Text style={{ fontSize: 10, color: colors.mutedForeground }}>XP</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        ) : null}

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTACT</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            {[
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Phone', value: profile.phone },
              { icon: Globe, label: 'Language', value: profile.language },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.label}
                  style={[styles.contactRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}
                >
                  <Icon size={16} color={colors.mutedForeground} />
                  <View style={styles.contactContent}>
                    <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>{item.value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETTINGS</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Bell size={16} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Push Notifications</Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={pushNotifications ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
              <Mail size={16} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Message Alerts</Text>
              <Switch
                value={messageAlerts}
                onValueChange={setMessageAlerts}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={messageAlerts ? colors.primary : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity
              style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => setShowLangPicker(true)}
            >
              <Globe size={16} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Language</Text>
              <Text style={[styles.langValue, { color: colors.mutedForeground }]}>{language}</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* More */}
        <View style={styles.section}>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.6} onPress={() => router.push('/privacy' as any)}>
              <Shield size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacy & Security</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6} onPress={() => router.push('/help' as any)}>
              <HelpCircle size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Help & Support</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#ef4444' + '30' }]}
            activeOpacity={0.7}
            onPress={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Turumba v2.3.1 · Joined {profile.joinedDate}
        </Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
          <View style={[styles.langPickerCard, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={styles.langPickerHeader}>
              <Globe size={18} color={colors.primary} />
              <Text style={[styles.langPickerTitle, { color: colors.foreground }]}>Select Language</Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => {
                const isActive = language === lang.name;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langRow, isActive && { backgroundColor: colors.primary + '10' }]}
                    activeOpacity={0.6}
                    onPress={() => { setLanguage(lang.name); setShowLangPicker(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langName, { color: isActive ? colors.primary : colors.foreground }, isActive && { fontFamily: 'DMSans_700Bold' }]}>
                        {lang.name}
                      </Text>
                      <Text style={[styles.langNative, { color: isActive ? colors.primary : colors.mutedForeground }]}>
                        {lang.native}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={[styles.langCheckCircle, { backgroundColor: colors.primary }]}>
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <LogOut size={22} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Out</Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.secondary }]}
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.replace('/login');
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },

  // Identity
  identityBlock: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  name: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  role: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginBottom: 10,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  orgText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },


  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  // Contact rows
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactContent: { flex: 1, gap: 1 },
  contactLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
  contactValue: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#ef4444',
  },

  // Version
  version: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },

  // Logout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  modalDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },

  // Language
  langValue: { fontFamily: 'DMSans_500Medium', fontSize: 13, marginRight: 4 },
  langPickerCard: { width: '100%', maxWidth: 320, borderRadius: 20, padding: 8 },
  langPickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  langPickerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17 },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 },
  langName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  langNative: { fontFamily: 'DMSans_500Medium', fontSize: 12, marginTop: 2 },
  langCheckCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

const gamStyles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  tierText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  statLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  badgeCount: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeCountText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
  },
  // Leaderboard
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  medalCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lbRank: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    width: 26,
    textAlign: 'center',
  },
  lbAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lbAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  lbName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  lbXp: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
});
