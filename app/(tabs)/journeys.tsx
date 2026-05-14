import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  LayoutAnimation,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  BookOpen,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { MaturityColors } from '@/constants/theme';
import { isApiConfigured } from '@/services/api';
import { JourneysAPI, type FaithJourney } from '@/services/journeys';

// ─── Wiring config ─────────────────────────────────────────────────────────
// Same hardcoded mentor / tenant pair as the rest of the app.
const TENANT_ID = 'tenant-1';

// ─── Journey type metadata ─────────────────────────────────────────────────
// API enum values for FaithJourney.type — see TURUMBA_MOBILE_APP_SPEC.md.
// We render one "curriculum card" per type, with each contact's record as
// an enrolled seeker row underneath.
const JOURNEY_TYPE_META: Record<string, { name: string; description: string; defaultTotal: number }> = {
  Salvation: {
    name: 'Salvation Journey',
    description: 'Discovering who Jesus is and making a decision to follow Him',
    defaultTotal: 4,
  },
  Baptism: {
    name: 'Baptism Journey',
    description: 'Preparing for and walking through baptism as a new believer',
    defaultTotal: 4,
  },
  Community: {
    name: 'Community Journey',
    description: 'Finding fellowship and growing in community with other believers',
    defaultTotal: 4,
  },
  Growth: {
    name: 'Growth Journey',
    description: 'Spiritual growth, discipline, and deepening maturity',
    defaultTotal: 4,
  },
};

// Stage → maturity label shown next to the seeker name.
const STAGE_MATURITY: Record<string, string> = {
  Touchpoint: 'Seeker',
  Engaged: 'Seeker',
  'Active Journey': 'New Believer',
  Decision: 'Growing',
};

const SEEKER_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorFor(id: string): string {
  return SEEKER_COLORS[hashCode(id) % SEEKER_COLORS.length];
}

function titleize(id: string): string {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  if (diff < 0) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

// Shape consumed by the existing render code.
interface EnrolledSeeker {
  id: string;
  name: string;
  initials: string;
  color: string;
  currentLesson: number;
  maturity: string;
  lastActive: string;
}

interface JourneyCard {
  id: string;
  name: string;
  description: string;
  totalLessons: number;
  category: string;
  enrolledSeekers: EnrolledSeeker[];
}

// Group raw FaithJourney records into one card per type.
function groupJourneys(records: FaithJourney[]): JourneyCard[] {
  const buckets = new Map<string, FaithJourney[]>();
  for (const r of records) {
    const key = r.type || 'Other';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const out: JourneyCard[] = [];
  for (const [type, items] of buckets) {
    const meta = JOURNEY_TYPE_META[type] || {
      name: `${type} Journey`,
      description: 'Faith journey in progress',
      defaultTotal: 4,
    };
    const totalLessons = Math.max(meta.defaultTotal, ...items.map((it) => it.total || 0));

    const enrolled: EnrolledSeeker[] = items.map((r) => {
      const name = titleize(r.contact_id);
      return {
        id: r.contact_id,
        name,
        initials: initialsFor(name),
        color: colorFor(r.contact_id),
        currentLesson: r.indicators || 0,
        maturity: STAGE_MATURITY[r.stage] || 'Seeker',
        lastActive: relativeTime(r.updated_at || r.started_at),
      };
    });

    out.push({
      id: type,
      name: meta.name,
      description: meta.description,
      totalLessons,
      category: type,
      enrolledSeekers: enrolled,
    });
  }
  // Add empty placeholders for any type with no enrollments yet so the tab
  // still feels populated.
  for (const type of Object.keys(JOURNEY_TYPE_META)) {
    if (!buckets.has(type)) {
      const meta = JOURNEY_TYPE_META[type];
      out.push({
        id: type,
        name: meta.name,
        description: meta.description,
        totalLessons: meta.defaultTotal,
        category: type,
        enrolledSeekers: [],
      });
    }
  }
  return out;
}

// Fallback mock — used when API isn't configured or returns nothing — so the
// tab keeps demoing well in environments without a live Supabase backend.
const MOCK_JOURNEYS: JourneyCard[] = [
  {
    id: 'mock-salvation',
    name: 'Salvation Journey',
    description: 'Discovering who Jesus is and making a decision to follow Him',
    totalLessons: 4,
    category: 'Salvation',
    enrolledSeekers: [
      { id: '1', name: 'Sarah Johnson', initials: 'SJ', color: '#2563eb', currentLesson: 3, maturity: 'New Believer', lastActive: '2m ago' },
      { id: '4', name: 'James Wilson', initials: 'JW', color: '#ef4444', currentLesson: 1, maturity: 'Seeker', lastActive: '3h ago' },
    ],
  },
  {
    id: 'mock-baptism',
    name: 'Baptism Journey',
    description: 'Preparing for and walking through baptism as a new believer',
    totalLessons: 4,
    category: 'Baptism',
    enrolledSeekers: [
      { id: '2', name: 'Daniel Mekonnen', initials: 'DM', color: '#10b981', currentLesson: 2, maturity: 'New Believer', lastActive: '15m ago' },
    ],
  },
  {
    id: 'mock-community',
    name: 'Community Journey',
    description: 'Finding fellowship and growing in community with other believers',
    totalLessons: 4,
    category: 'Community',
    enrolledSeekers: [
      { id: '6', name: 'David Kim', initials: 'DK', color: '#ec4899', currentLesson: 3, maturity: 'Growing', lastActive: '1d ago' },
    ],
  },
  {
    id: 'mock-growth',
    name: 'Growth Journey',
    description: 'Spiritual growth, discipline, and deepening maturity',
    totalLessons: 4,
    category: 'Growth',
    enrolledSeekers: [
      { id: '3', name: 'Maria Garcia', initials: 'MG', color: '#f59e0b', currentLesson: 3, maturity: 'Growing', lastActive: '2h ago' },
      { id: '7', name: 'Abebe Tadesse', initials: 'AT', color: '#8b5cf6', currentLesson: 4, maturity: 'Mature', lastActive: '2d ago' },
    ],
  },
];

type FilterType = 'all' | 'Salvation' | 'Baptism' | 'Community' | 'Growth';

export default function JourneysScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Real API data ───────────────────────────────────────────────────────
  const [journeys, setJourneys] = useState<JourneyCard[]>(MOCK_JOURNEYS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usingMock, setUsingMock] = useState<boolean>(false);

  const loadJourneys = async (isRefresh = false) => {
    if (!isApiConfigured()) {
      // No backend configured — keep the mock so the tab still looks alive.
      setJourneys(MOCK_JOURNEYS);
      setUsingMock(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await JourneysAPI.list(TENANT_ID);
    // Defensive unwrap: some endpoints double-wrap data.
    const raw = (res as any)?.data?.data ?? res.data;
    const records: FaithJourney[] = Array.isArray(raw) ? raw : [];

    if (res.error || records.length === 0) {
      // Empty / errored — fall back to the mock so the screen is never blank.
      setJourneys(MOCK_JOURNEYS);
      setUsingMock(true);
    } else {
      setJourneys(groupJourneys(records));
      setUsingMock(false);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJourneys = journeys.filter((j) => {
    const matchesFilter = filter === 'all' || j.category === filter;
    const matchesSearch =
      !searchQuery || j.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort: journeys with enrolled seekers first, then by enrollment count
  const sorted = [...filteredJourneys].sort((a, b) => {
    if (a.enrolledSeekers.length > 0 && b.enrolledSeekers.length === 0) return -1;
    if (a.enrolledSeekers.length === 0 && b.enrolledSeekers.length > 0) return 1;
    return b.enrolledSeekers.length - a.enrolledSeekers.length;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Salvation', label: 'Salvation' },
    { key: 'Baptism', label: 'Baptism' },
    { key: 'Growth', label: 'Growth' },
    { key: 'Community', label: 'Community' },
  ];

  const renderSeeker = (seeker: EnrolledSeeker, totalLessons: number) => {
    const progress = seeker.currentLesson / totalLessons;
    const completed = seeker.currentLesson >= totalLessons;
    const maturityColor = MaturityColors[seeker.maturity] || '#94a3b8';

    return (
      <TouchableOpacity
        key={seeker.id}
        style={[styles.seekerRow, { borderTopColor: colors.border }]}
        activeOpacity={0.6}
        onPress={() => router.push(`/seeker/${seeker.id}`)}
      >
        <View style={[styles.seekerAvatar, { backgroundColor: seeker.color }]}>
          <Text style={styles.seekerAvatarText}>{seeker.initials}</Text>
        </View>
        <View style={styles.seekerInfo}>
          <Text style={[styles.seekerName, { color: colors.foreground }]} numberOfLines={1}>
            {seeker.name}
          </Text>
          <View style={styles.seekerMeta}>
            <View style={[styles.maturityDot, { backgroundColor: maturityColor }]} />
            <Text style={[styles.seekerMetaText, { color: colors.mutedForeground }]}>
              Lesson {seeker.currentLesson}/{totalLessons}
            </Text>
            <Text style={[styles.seekerMetaDot, { color: colors.border }]}>·</Text>
            <Text style={[styles.seekerMetaText, { color: colors.mutedForeground }]}>{seeker.lastActive}</Text>
          </View>
        </View>
        <View style={styles.seekerProgress}>
          {completed ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <View style={[styles.miniProgressBg, { backgroundColor: colors.secondary }]}>
              <View style={[styles.miniProgressFill, { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` }]} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderJourney = ({ item }: { item: JourneyCard }) => {
    const isExpanded = expandedId === item.id;
    const enrolled = item.enrolledSeekers.length;
    const completedCount = item.enrolledSeekers.filter((s) => s.currentLesson >= item.totalLessons).length;

    return (
      <View style={[styles.journeyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.journeyHeader}
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
            setExpandedId(isExpanded ? null : item.id);
          }}
        >
          {/* Icon */}
          <View style={[styles.journeyIcon, { backgroundColor: colors.secondary }]}>
            <BookOpen size={18} color={colors.primary} />
          </View>

          {/* Title + meta */}
          <View style={styles.journeyContent}>
            <Text style={[styles.journeyName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.journeyMeta}>
              <Text style={[styles.journeyMetaText, { color: colors.mutedForeground }]}>
                {item.totalLessons} lessons
              </Text>
              <Text style={[styles.journeyMetaDot, { color: colors.border }]}>·</Text>
              <Text style={[styles.journeyMetaText, { color: colors.mutedForeground }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {/* Enrolled count */}
          <View style={styles.journeyRight}>
            {enrolled > 0 ? (
              <View style={styles.enrolledWrap}>
                <Users size={13} color={colors.mutedForeground} />
                <Text style={[styles.enrolledText, { color: colors.foreground }]}>{enrolled}</Text>
              </View>
            ) : (
              <Text style={[styles.noEnrolledText, { color: colors.mutedForeground }]}>—</Text>
            )}
            <ChevronRight
              size={16}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
            />
          </View>
        </TouchableOpacity>

        {/* Description */}
        <Text style={[styles.journeyDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Progress summary when has enrollees */}
        {enrolled > 0 && (
          <View style={styles.progressSummary}>
            <View style={[styles.summaryChip, { backgroundColor: colors.secondary }]}>
              <Users size={11} color={colors.mutedForeground} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{enrolled} enrolled</Text>
            </View>
            {completedCount > 0 && (
              <View style={[styles.summaryChip, { backgroundColor: colors.secondary }]}>
                <CheckCircle2 size={11} color="#10b981" />
                <Text style={[styles.summaryText, { color: colors.foreground }]}>{completedCount} completed</Text>
              </View>
            )}
          </View>
        )}

        {/* Expanded: seeker list */}
        {isExpanded && enrolled > 0 && (
          <View style={styles.seekerList}>
            {item.enrolledSeekers.map((s) => renderSeeker(s, item.totalLessons))}
          </View>
        )}

        {/* Expanded: empty state */}
        {isExpanded && enrolled === 0 && (
          <View style={[styles.emptyEnrolled, { borderTopColor: colors.border }]}>
            <Circle size={14} color={colors.mutedForeground} />
            <Text style={[styles.emptyEnrolledText, { color: colors.mutedForeground }]}>
              No seekers enrolled yet
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Journeys</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search journeys..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: filter === f.key ? '#000022' : colors.secondary },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? '#fff' : colors.foreground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Journey List */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, marginTop: 8 }]}>
            Loading journeys…
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderJourney}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 + insets.bottom, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadJourneys(true)}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            usingMock ? (
              <View style={[styles.demoBanner, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.demoBannerText, { color: colors.mutedForeground }]}>
                  Showing demo data — connect Supabase to load real journeys
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookOpen size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No journeys found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    padding: 0,
  },

  // Filter Tabs
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  filterText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },

  // Journey Card
  journeyCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journeyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyContent: {
    flex: 1,
    gap: 2,
  },
  journeyName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  journeyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  journeyMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  journeyMetaDot: {
    fontSize: 12,
  },
  journeyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enrolledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  noEnrolledText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },

  // Description
  journeyDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    paddingLeft: 52,
  },

  // Progress summary chips
  progressSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingLeft: 52,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  summaryText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },

  // Seeker list (expanded)
  seekerList: {
    marginTop: 12,
  },
  seekerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  seekerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekerAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  seekerInfo: {
    flex: 1,
    gap: 1,
  },
  seekerName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  seekerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  maturityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  seekerMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  seekerMetaDot: {
    fontSize: 11,
  },
  seekerProgress: {
    width: 60,
    alignItems: 'flex-end',
  },
  miniProgressBg: {
    width: 48,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Empty enrolled
  emptyEnrolled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    justifyContent: 'center',
  },
  emptyEnrolledText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },

  // Demo banner
  demoBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  demoBannerText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
});
