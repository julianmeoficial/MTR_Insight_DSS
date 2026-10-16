/**
 * Versioned alert policies.
 *
 * Known conflict: Paso 5/8 specify three consecutive red weeks for PG-02;
 * Paso 11 CP-02 specifies two. This repo uses two (checklist / ENG scope)
 * until the tutor approves a single policy. Do not mark CP-02 accepted yet.
 */

export const ALERT_POLICIES_VERSION = "1.0.0" as const;

export const alertPolicies = {
  version: ALERT_POLICIES_VERSION,
  k1RedStreak: {
    /** Consecutive weeks in red before K1_RED_STREAK fires */
    redStreakWeeks: 2,
    owner: "Dirección Comercial",
    policyRef: "PG-02",
  },
  sourceNotLoaded: {
    owner: "TI",
    policyRef: "PG-01",
  },
} as const;

export type AlertPolicies = typeof alertPolicies;
