/**
 * Demo visibility matrix from Paso 8 §6 and Paso 10 §3.
 * Staging UI only: not authentication, MFA, or server-side authorization.
 */

export const ROLE_IDS = [
  "junta",
  "gerencia_general",
  "gerencia_mtr",
  "comercial",
  "juridica",
  "infraestructura",
  "coordinacion",
  "ti",
  "satena",
  "copa",
  "ani",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const MATRIX_SCREENS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
] as const;

export type MatrixScreen = (typeof MATRIX_SCREENS)[number];

export type OperatorScope = "Satena" | "Copa" | null;

export type RoleAccess = {
  screens: readonly MatrixScreen[];
  canExport: boolean;
  operatorScope: OperatorScope;
};

export const ACCESS_MATRIX: Record<RoleId, RoleAccess> = {
  junta: {
    screens: ["P1", "P4", "P6"],
    canExport: true,
    operatorScope: null,
  },
  gerencia_general: {
    screens: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
    canExport: true,
    operatorScope: null,
  },
  gerencia_mtr: {
    screens: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
    canExport: true,
    operatorScope: null,
  },
  comercial: {
    screens: ["P1", "P2", "P5"],
    canExport: true,
    operatorScope: null,
  },
  juridica: {
    screens: ["P1", "P3"],
    canExport: true,
    operatorScope: null,
  },
  infraestructura: {
    screens: ["P4", "P6"],
    canExport: true,
    operatorScope: null,
  },
  coordinacion: {
    screens: ["P2", "P3", "P4"],
    canExport: false,
    operatorScope: null,
  },
  ti: {
    screens: ["P7"],
    canExport: true,
    operatorScope: null,
  },
  satena: {
    screens: ["P2"],
    canExport: false,
    operatorScope: "Satena",
  },
  copa: {
    screens: ["P2"],
    canExport: false,
    operatorScope: "Copa",
  },
  ani: {
    screens: ["P3", "P4"],
    canExport: false,
    operatorScope: null,
  },
};
