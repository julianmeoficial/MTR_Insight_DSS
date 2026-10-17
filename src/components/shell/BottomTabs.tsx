"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  MoreHorizontal,
  Route,
  TrendingUp,
} from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { cn } from "@/lib/cn";
import styles from "./BottomTabs.module.css";

export function BottomTabs() {
  const pathname = usePathname();
  const { dict } = usePreferences();

  const tabs = [
    { href: "/p1", label: dict.nav.board, Icon: LayoutDashboard },
    { href: "/p2", label: dict.nav.routes, Icon: Route },
    { href: "/p6", label: dict.nav.planning, Icon: TrendingUp },
    { href: "/alertas", label: dict.nav.alerts, Icon: Bell },
    { href: "/", label: dict.nav.product, Icon: MoreHorizontal },
  ] as const;

  return (
    <nav aria-label={dict.nav.views} className={styles.tabs}>
      <ul className={styles.list}>
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className={styles.item}>
              <Link
                href={href}
                className={cn(styles.link, active && styles.active)}
              >
                <Icon strokeWidth={1.5} size={20} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
