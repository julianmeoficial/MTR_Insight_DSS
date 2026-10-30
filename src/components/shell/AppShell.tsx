"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TrafficLight } from "@/domain/types";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { BottomTabs } from "@/components/shell/BottomTabs";
import { NavRail } from "@/components/shell/NavRail";
import { TopBar } from "@/components/shell/TopBar";
import { Cockpit } from "@/components/shell/Cockpit";
import {
  CommandPalette,
  type CommandPaletteGroup,
} from "@/components/ui/CommandPalette";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { allowedNavHrefs } from "@/domain/access";
import { ShortcutSheet } from "@/components/shell/ShortcutSheet";
import { StatusBar } from "@/components/shell/StatusBar";
import { isTypingTarget } from "@/hooks/useListKeys";
import { NAV_SHORTCUTS, SEQUENCE_TIMEOUT_MS } from "@/lib/shortcuts";
import type { RoleId } from "@/config/access-matrix";
import styles from "./AppShell.module.css";

type Props = {
  children: React.ReactNode;
  role: RoleId;
  globalStatus: TrafficLight;
  lastValidated: string;
  asOfDate: string;
  breadcrumb?: string;
  alertIds?: readonly string[];
  dataset: { source: string; version: string; verificationStatus: string };
};

export function AppShell({
  children,
  role,
  globalStatus,
  lastValidated,
  asOfDate,
  breadcrumb,
  alertIds = [],
  dataset,
}: Props) {
  const { dict } = usePreferences();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      setPaletteOpen(false);
    },
    [router],
  );

  const allowedShortcuts = useMemo(() => {
    const allowed = new Set(allowedNavHrefs(role));
    return NAV_SHORTCUTS.filter((item) => allowed.has(item.href));
  }, [role]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setSheetOpen((open) => !open);
        return;
      }
      const key = e.key.toLowerCase();
      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const target = allowedShortcuts.find((item) => item.key === key);
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }
      if (key === "g") {
        pendingG.current = window.setTimeout(() => {
          pendingG.current = null;
        }, SEQUENCE_TIMEOUT_MS);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (pendingG.current !== null) window.clearTimeout(pendingG.current);
    };
  }, [allowedShortcuts, router]);

  const groups = useMemo<CommandPaletteGroup[]>(() => {
    const allowed = new Set(allowedNavHrefs(role));
    const navItems: CommandPaletteGroup["items"] = allowedShortcuts.map((item) => ({
      id: item.href,
      label: dict.nav[item.labelKey],
      hint: `G ${item.key.toUpperCase()}`,
      onSelect: () => go(item.href),
    }));
    if (allowed.has("/admin")) {
      navItems.push({
        id: "/admin",
        label: dict.nav.admin,
        onSelect: () => go("/admin"),
      });
    }

    return [
      { id: "nav", label: dict.nav.views, items: navItems },
      {
        id: "general",
        label: dict.shortcutsSheet.general,
        items: [
          {
            id: "shortcuts",
            label: dict.shortcutsSheet.title,
            hint: "?",
            onSelect: () => setSheetOpen(true),
          },
        ],
      },
    ];
  }, [allowedShortcuts, dict, go, role]);

  return (
    <div className={styles.shell}>
      <DemoBanner />
      <TopBar
        role={role}
        globalStatus={globalStatus}
        lastValidated={lastValidated}
        asOfDate={asOfDate}
        breadcrumb={breadcrumb}
      />
      <Cockpit
        rail={
          <NavRail
            role={role}
            alertIds={alertIds}
            onSearch={() => setPaletteOpen(true)}
          />
        }
      >
        {children}
      </Cockpit>
      <StatusBar
        role={role}
        dataset={dataset.version}
        source={dataset.source}
        verificationStatus={dataset.verificationStatus}
        asOfDate={asOfDate}
        onShortcuts={() => setSheetOpen(true)}
      />
      <BottomTabs role={role} />
      <CommandPalette
        groups={groups}
        placeholder={dict.shell.commandPalette}
        emptyLabel={dict.states.empty}
        closeLabel={dict.states.emptyAction}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      <ShortcutSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        shortcuts={allowedShortcuts}
      />
    </div>
  );
}
