/** G-then-letter navigation (DESIGN.md §8.2). Labels come from dict.nav. */
export const NAV_SHORTCUTS = [
  { key: "t", href: "/p1", labelKey: "board" },
  { key: "r", href: "/p2", labelKey: "routes" },
  { key: "c", href: "/p3", labelKey: "compliance" },
  { key: "i", href: "/p4", labelKey: "infrastructure" },
  { key: "d", href: "/p5", labelKey: "demand" },
  { key: "p", href: "/p6", labelKey: "planning" },
  { key: "q", href: "/p7", labelKey: "quality" },
  { key: "a", href: "/alertas", labelKey: "alerts" },
  { key: "s", href: "/situacion", labelKey: "situation" },
  { key: "e", href: "/escenarios", labelKey: "scenarios" },
  { key: "v", href: "/validador", labelKey: "validator" },
] as const;

export type NavShortcut = (typeof NAV_SHORTCUTS)[number];

/** Window after G during which the second key counts. */
export const SEQUENCE_TIMEOUT_MS = 900;
