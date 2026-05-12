// ============================================================================
// Faith Journeys & Milestones Service — Mobile
// API calls for the faith journey and milestone features
// ============================================================================

import { api } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FaithJourney {
  id: string;
  contact_id: string;
  tenant_id: string;
  source: string;
  type: string;
  stage: string;
  indicators: number;
  total: number;
  milestone: string;
  validation: string;
  language: string;
  assigned_by: string | null;
  paused_at: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneEntry {
  id: string;
  contact_milestone_id: string;
  key: string;
  label: string;
  date: string;
  state: "done" | "progress" | "pending";
  sub: string[];
  sort_order: number;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

export interface ContactMilestones {
  id: string;
  contact_id: string;
  tenant_id: string;
  milestone_entries: MilestoneEntry[];
}

// ─── Journeys ────────────────────────────────────────────────────────────────

export const JourneysAPI = {
  /** List journeys for a contact */
  async listForContact(tenantId: string, contactId: string) {
    return api<FaithJourney[]>("/journeys", {
      params: { tenant_id: tenantId, contact_id: contactId },
    });
  },

  /** List all journeys for a tenant */
  async list(tenantId: string) {
    return api<FaithJourney[]>("/journeys", {
      params: { tenant_id: tenantId },
    });
  },

  /** Get a single journey */
  async get(id: string) {
    return api<FaithJourney>(`/journeys/${id}`);
  },

  /** Create a new journey */
  async create(data: {
    contact_id: string;
    tenant_id: string;
    source?: string;
    type?: string;
    language?: string;
    assigned_by?: string;
  }) {
    return api<FaithJourney>("/journeys", { method: "POST", body: data });
  },

  /** Update a journey */
  async update(id: string, data: Partial<FaithJourney>) {
    return api<FaithJourney>(`/journeys/${id}`, { method: "PUT", body: data });
  },

  /** Advance to next stage */
  async advance(id: string) {
    return api<FaithJourney>(`/journeys/${id}/advance`, { method: "POST" });
  },

  /** Pause/unpause */
  async togglePause(id: string) {
    return api<FaithJourney>(`/journeys/${id}/pause`, { method: "POST" });
  },

  /** Delete a journey */
  async delete(id: string) {
    return api(`/journeys/${id}`, { method: "DELETE" });
  },
};

// ─── Milestones ──────────────────────────────────────────────────────────────

export const MilestonesAPI = {
  /** Get milestones for a contact */
  async getForContact(contactId: string, tenantId: string) {
    return api<ContactMilestones>(`/journeys/milestones/${contactId}`, {
      params: { tenant_id: tenantId },
    });
  },

  /** Create milestone record (with 4 default entries) */
  async create(contactId: string, tenantId: string) {
    return api<ContactMilestones>("/journeys/milestones", {
      method: "POST",
      body: { contact_id: contactId, tenant_id: tenantId },
    });
  },

  /** Update a single milestone entry */
  async updateEntry(
    entryId: string,
    data: Partial<{
      state: string;
      date: string;
      sub: string[];
      confirmed_by: string;
    }>
  ) {
    return api<MilestoneEntry>(`/journeys/milestones/entries/${entryId}`, {
      method: "PUT",
      body: data,
    });
  },
};
