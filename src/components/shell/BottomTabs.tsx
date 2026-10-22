"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Database,
  Globe2,
  LayoutDashboard,
  LogIn,
  Route,
  Scale,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { allowedNavHrefs } from "@/domain/access";
import type { RoleId } from "@/config/access-matrix";
import { cn } from "@/lib/cn";
import styles from "./BottomTabs.module.css";

const TAB_ORDER = [
  { href: "/p1", labelKey: "board", Icon: LayoutDashboard },
  { href: "/p2", labelKey: "routes", Icon: Route },
  { href: "/p6", labelKey: "planning", Icon: TrendingUp },
  { href: "/alertas", labelKey: "alerts", Icon: Bell },
  { href: "/p7", labelKey: "quality", Icon: Database },
  { href: "/p3", labelKey: "compliance", Icon: BadgeCheck },
  { href: "/p4", labelKey: "infrastructure", Icon: Building2 },
  { href: "/p5", labelKey: "demand", Icon: Globe2 },
  { href: "/escenarios", labelKey: "scenarios", Icon: Scale },
] as const;

export function BottomTabs({ role }: { role: RoleId }) {
  const pathname = usePathname();
  const { dict } = usePreferences();
  const allowed = new Set(allowedNavHrefs(role));
  const tabs = TAB_ORDER.filter((tab) => allowed.has(tab.href)).slice(0, 4);

  return (
    <nav aria-label={dict.nav.views} className={styles.tabs}>
      <ul className={styles.list}>
        {tabs.map(({ href, labelKey, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className={styles.item}>
              <Link
                href={href}
                className={cn(styles.link, active && styles.active)}
              >
                <Icon strokeWidth={1.5} size={20} aria-hidden />
                {dict.nav[labelKey]}
              </Link>
            </li>
          );
        })}
        <li className={styles.item}>
          <Link
            href="/login"
            className={cn(styles.link, pathname === "/login" && styles.active)}
          >
            <LogIn strokeWidth={1.5} size={20} aria-hidden />
            {dict.access.accountTab}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
