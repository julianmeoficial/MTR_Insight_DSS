/**
 * Versioned KPI traffic-light thresholds (Paso 8 / .cursorrules).
 * Evaluate with raw ratios; round only for presentation.
 */

export const THRESHOLDS_VERSION = "1.0.0" as const;

export const kpiThresholds = {
  version: THRESHOLDS_VERSION,
  K1: {
    /** Green when value >= greenMin */
    greenMin: 0.7,
    /** Yellow when yellowMin <= value < greenMin */
    yellowMin: 0.65,
  },
  K2: {
    /** Quarterly compliance below this forces red */
    quarterlyRedBelow: 0.9,
  },
  K3: {
    /** Green when value < greenBelow */
    greenBelow: 0.8,
    /** Yellow when greenBelow <= value < redMin; red when >= redMin */
    redMin: 0.9,
  },
  K4: {
    greenMin: 0.2,
    yellowMin: 0.1,
  },
  K5: {
    greenMin: 0.98,
    yellowMin: 0.95,
  },
  capacity: {
    defaultDeclaredAnnual: 1_700_000,
  },
} as const;

export type KpiThresholds = typeof kpiThresholds;
