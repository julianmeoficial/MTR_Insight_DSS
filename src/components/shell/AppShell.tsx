"use client";

import { useCallback, useMemo, useState } from "react";
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
import type { RoleId } from "@/config/access-matrix";
import styles from "./AppShell.module.css";

type Props = {
  children: React.ReactNode;
  role: RoleId;
  globalStatus: TrafficLight;
  lastValidated: string;
  asOfDate: string;
  breadcrumb?: string;
  alertCount?: number;
};

export function AppShell({
  children,
  role,
  globalStatus,
  lastValidated,
  asOfDate,
  breadcrumb,
  alertCount = 0,
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

  const groups = useMemo<CommandPaletteGroup[]>(() => {
    const allowed = new Set(allowedNavHrefs(role));
    const items = [
      { id: "p1", href: "/p1", label: dict.nav.board, hint: "G T" },
      { id: "p2", href: "/p2", label: dict.nav.routes, hint: "G R" },
      { id: "p3", href: "/p3", label: dict.nav.compliance, hint: "G C" },
      { id: "p4", href: "/p4", label: dict.nav.infrastructure, hint: "G I" },
      { id: "p5", href: "/p5", label: dict.nav.demand, hint: "G D" },
      { id: "p6", href: "/p6", label: dict.nav.planning, hint: "G P" },
      { id: "p7", href: "/p7", label: dict.nav.quality, hint: "G Q" },
      { id: "alerts", href: "/alertas", label: dict.nav.alerts, hint: "G A" },
      { id: "scenarios", href: "/escenarios", label: dict.nav.scenarios },
    ].filter((item) => allowed.has(item.href));

    return [
      {
        id: "nav",
        label: dict.nav.views,
        items: items.map((item) => ({
          id: item.id,
          label: item.label,
          hint: "hint" in item ? item.hint : undefined,
          onSelect: () => go(item.href),
        })),
      },
    ];
  }, [dict, go, role]);

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
            alertCount={alertCount}
            onSearch={() => setPaletteOpen(true)}
          />
        }
      >
        {children}
      </Cockpit>
      <BottomTabs role={role} />
      <CommandPalette
        groups={groups}
        placeholder={dict.shell.commandPalette}
        emptyLabel={dict.states.empty}
        closeLabel={dict.states.emptyAction}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </div>
  );
}
