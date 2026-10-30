"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BadgeCheck,
  Building2,
  Globe2,
  TrendingUp,
  Database,
  Bell,
  Scale,
  PenLine,
  Search,
  Compass,
  Route,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { allowedNavHrefs } from "@/domain/access";
import type { RoleId } from "@/config/access-matrix";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";
import { useReadAlerts } from "@/hooks/useReadAlerts";
import styles from "./NavRail.module.css";

type NavItem = {
  href: string;
  labelKey:
    | "board"
    | "routes"
    | "compliance"
    | "infrastructure"
    | "demand"
    | "planning"
    | "quality"
    | "alerts"
    | "scenarios"
    | "decisions"
    | "situation"
    | "validator"
    | "admin";
  icon: typeof LayoutDashboard;
  count?: number;
};

const VIEW_ITEMS: NavItem[] = [
  { href: "/p1", labelKey: "board", icon: LayoutDashboard },
  { href: "/p2", labelKey: "routes", icon: ArrowLeftRight },
  { href: "/p3", labelKey: "compliance", icon: BadgeCheck },
  { href: "/p4", labelKey: "infrastructure", icon: Building2 },
  { href: "/p5", labelKey: "demand", icon: Globe2 },
  { href: "/p6", labelKey: "planning", icon: TrendingUp },
  { href: "/p7", labelKey: "quality", icon: Database },
];

const CONTEXT_ITEMS: NavItem[] = [
  { href: "/situacion", labelKey: "situation", icon: Compass },
];

const DSS_ITEMS: NavItem[] = [
  { href: "/escenarios", labelKey: "scenarios", icon: Scale },
  { href: "/validador", labelKey: "validator", icon: Route },
  { href: "/decisiones", labelKey: "decisions", icon: PenLine },
];

const GOV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "admin", icon: ShieldCheck },
];

type Props = {
  role: RoleId;
  alertIds?: readonly string[];
  onSearch?: () => void;
};

export function NavRail({ role, alertIds = [], onSearch }: Props) {
  const { isRead } = useReadAlerts();
  const alertCount = alertIds.filter((id) => !isRead(id)).length;
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const { dict } = usePreferences();
  const allowed = new Set(allowedNavHrefs(role));
  const views = VIEW_ITEMS.filter((item) => allowed.has(item.href));
  const context = CONTEXT_ITEMS.filter((item) => allowed.has(item.href));
  const dss = DSS_ITEMS.filter((item) => allowed.has(item.href));
  const gov = GOV_ITEMS.filter((item) => allowed.has(item.href));
  const showAlerts = allowed.has("/alertas");

  function renderItem(item: NavItem) {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    const label = dict.nav[item.labelKey];
    return (
      <li key={item.href} className={styles.item}>
        {active && !reduced ? (
          <motion.span
            layoutId="nav-indicator"
            className={styles.indicator}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        ) : null}
        {active && reduced ? <span className={styles.indicator} /> : null}
        <Link
          href={item.href}
          className={cn(styles.link, active && styles.active)}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={16} strokeWidth={1.5} className={styles.icon} aria-hidden />
          <span className={styles.title}>{label}</span>
          {item.count !== undefined && item.count > 0 ? (
            <span className={cn("num", styles.count)}>{item.count}</span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <nav aria-label={dict.nav.views} className={styles.rail}>
      <div className={styles.brand}>
        <WayfindingTag variant="location">{dict.hero.tag}</WayfindingTag>
      </div>
      <button
        type="button"
        className={styles.search}
        onClick={onSearch}
        aria-label={dict.shell.commandPalette}
      >
        <Search size={16} strokeWidth={1.5} aria-hidden />
        <span>{dict.nav.search}</span>
        <Kbd>⌘K</Kbd>
      </button>
      {showAlerts ? (
        <ul className={styles.list}>
          <li className={styles.item}>
            <Link
              href="/alertas"
              className={cn(
                styles.link,
                (pathname === "/alertas" || pathname.startsWith("/alertas/")) &&
                  styles.active,
              )}
            >
              <Bell size={16} strokeWidth={1.5} className={styles.icon} aria-hidden />
              <span className={styles.title}>{dict.nav.alerts}</span>
              {alertCount > 0 ? (
                <span className={cn("num", styles.count)}>{alertCount}</span>
              ) : null}
            </Link>
          </li>
        </ul>
      ) : null}
      {views.length > 0 ? (
        <>
          <p className={styles.groupLabel}>{dict.nav.views}</p>
          <ul className={styles.list}>{views.map(renderItem)}</ul>
        </>
      ) : null}
      {context.length > 0 ? (
        <>
          <p className={styles.groupLabel}>{dict.nav.groupContext}</p>
          <ul className={styles.list}>{context.map(renderItem)}</ul>
        </>
      ) : null}
      {dss.length > 0 ? (
        <>
          <p className={styles.groupLabel}>{dict.nav.groupDss}</p>
          <ul className={styles.list}>{dss.map(renderItem)}</ul>
        </>
      ) : null}
      {gov.length > 0 ? (
        <>
          <p className={styles.groupLabel}>{dict.nav.groupGov}</p>
          <ul className={styles.list}>{gov.map(renderItem)}</ul>
        </>
      ) : null}
    </nav>
  );
}
