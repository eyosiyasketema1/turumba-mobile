// ============================================================================
// Gamification Service — Mobile
// Profiles, points, streaks, and engine processing
// ============================================================================

import { api } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GamificationProfile {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: "seeker" | "mentor";
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at: string | null;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface PointsSummary {
  total_xp: number;
  this_week: number;
  this_month: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return 50 * (level - 1) * (level - 1);
}

export function xpProgress(totalXp: number, currentLevel: number) {
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  const progress = totalXp - currentLevelXp;
  return {
    currentLevelXp,
    nextLevelXp,
    progressPct: range > 0 ? Math.min(100, Math.round((progress / range) * 100)) : 100,
  };
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "platinum": return "#a855f7";
    case "gold": return "#f59e0b";
    case "silver": return "#94a3b8";
    case "bronze": return "#d97706";
    default: return "#94a3b8";
  }
}

export function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// ─── Badge Types (Phase 3) ──────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: "achievement" | "milestone" | "streak" | "special";
  criteria: Record<string, any>;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
}

export interface BadgeAward {
  id: string;
  actor_id: string;
  badge_id: string;
  awarded_at: string;
  badge: BadgeDefinition;
}

export function rarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary": return "#f59e0b";
    case "epic": return "#a855f7";
    case "rare": return "#3b82f6";
    case "common": return "#94a3b8";
    default: return "#94a3b8";
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const GamificationAPI = {
  async getProfile(actorId: string, accountId: string) {
    return api<GamificationProfile>(`/gamification/profiles/${actorId}`, {
      params: { account_id: accountId },
    });
  },

  async getPointsSummary(actorId: string, accountId: string) {
    return api<PointsSummary>(`/gamification/points/${actorId}/summary`, {
      params: { account_id: accountId },
    });
  },

  async getPointsHistory(actorId: string, accountId: string, limit = 20) {
    return api<PointTransaction[]>(`/gamification/points/${actorId}`, {
      params: { account_id: accountId, limit: String(limit) },
    });
  },

  async processEvent(data: {
    account_id: string;
    actor_id: string;
    actor_type: string;
    event_type: string;
    event_data?: Record<string, any>;
  }) {
    return api<{ processed: number; actions: any[] }>("/gamification/engine/process", {
      method: "POST",
      body: data,
    });
  },

  async updateStreak(accountId: string, actorId: string, actorType: string) {
    return api<{ new_streak: number }>("/gamification/streak/update", {
      method: "POST",
      body: { account_id: accountId, actor_id: actorId, actor_type: actorType },
    });
  },

  // Phase 3: Badges
  async getBadges(accountId: string) {
    return api<BadgeDefinition[]>("/gamification/badges", {
      params: { account_id: accountId },
    });
  },

  async getAwardedBadges(actorId: string, accountId: string) {
    return api<BadgeAward[]>(`/gamification/badges/${actorId}`, {
      params: { account_id: accountId },
    });
  },

  async checkBadge(accountId: string, actorId: string, actorType: string, badgeSlug: string) {
    return api<{ badge_slug: string; status: string; badge_name?: string; rarity?: string; xp_reward?: number }>(
      "/gamification/badges/check",
      {
        method: "POST",
        body: { account_id: accountId, actor_id: actorId, actor_type: actorType, badge_slug: badgeSlug },
      }
    );
  },

  // Phase 4: Leaderboards & Notifications
  async getLeaderboard(accountId: string, boardType = "weekly", actorType?: string, limit = 20) {
    const params: Record<string, string> = { account_id: accountId, board_type: boardType, limit: String(limit) };
    if (actorType) params.actor_type = actorType;
    return api<LeaderboardEntry[]>("/gamification/leaderboard", { params });
  },

  async getNotifications(actorId: string, accountId: string, limit = 30) {
    return api<GamNotification[]>("/gamification/notifications", {
      params: { account_id: accountId, actor_id: actorId, limit: String(limit) },
    });
  },

  async markNotificationRead(id: string) {
    return api<any>(`/gamification/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllNotificationsRead(accountId: string, actorId: string) {
    return api<any>("/gamification/notifications/read-all", {
      method: "POST",
      body: { account_id: accountId, actor_id: actorId },
    });
  },

  async getUnreadNotifications(actorId: string, accountId: string) {
    return api<GamNotification[]>("/gamification/notifications", {
      params: { account_id: accountId, actor_id: actorId, unread: "true", limit: "50" },
    });
  },

  // Phase 6: Re-engagement
  async getReengagementTemplates(accountId: string) {
    return api<ReengagementTemplate[]>("/gamification/reengagement/templates", {
      params: { account_id: accountId },
    });
  },

  async getEnrollments(actorId: string, accountId: string, status = "active") {
    return api<AutomationEnrollment[]>(`/gamification/reengagement/enrollments/${actorId}`, {
      params: { account_id: accountId, status },
    });
  },

  async getDrips(enrollmentId: string) {
    return api<DripMessage[]>(`/gamification/reengagement/drips/${enrollmentId}`);
  },

  async enrollInAutomation(data: {
    account_id: string;
    actor_id: string;
    actor_type?: string;
    template_slug: string;
  }) {
    return api<{ enrollment_id: string; template_name: string; steps_count: number; status: string }>(
      "/gamification/reengagement/enroll",
      { method: "POST", body: data }
    );
  },

  async cancelEnrollment(id: string) {
    return api<{ id: string; status: string }>(`/gamification/reengagement/enrollments/${id}/cancel`, {
      method: "PATCH",
    });
  },
};

// ─── Phase 6: Re-engagement Types ──────────────────────────────────────────

export interface ReengagementTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  trigger_type: "manual" | "streak_broken" | "silence" | "dropout_risk";
  steps: Array<{ delay_hours: number; channel: string; message: string }>;
  is_active: boolean;
}

export interface AutomationEnrollment {
  id: string;
  actor_id: string;
  actor_type: string;
  template_id: string;
  status: "active" | "completed" | "cancelled";
  current_step: number;
  enrolled_at: string;
  completed_at: string | null;
  metadata_: Record<string, any>;
  reengagement_templates?: ReengagementTemplate;
}

export interface DripMessage {
  id: string;
  enrollment_id: string;
  step_index: number;
  message_content: string;
  channel: string;
  status: "pending" | "sent" | "delivered" | "failed";
  scheduled_at: string;
  sent_at: string | null;
}

// Phase 4 types
export interface LeaderboardEntry {
  id: string;
  actor_id: string;
  actor_type: string;
  board_type: string;
  period_key: string;
  xp_earned: number;
  rank: number;
}

export interface GamNotification {
  id: string;
  actor_id: string;
  notification_type: string;
  title: string;
  body: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}
