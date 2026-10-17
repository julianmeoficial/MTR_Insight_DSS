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
import styles from "./AppShell.module.css";

type Props = {
  children: React.ReactNode;
  globalStatus: TrafficLight;
  lastValidated: string;
  asOfDate: string;
  breadcrumb?: string;
  alertCount?: number;
};

export function AppShell({
  children,
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

  const groups = useMemo<CommandPaletteGroup[]>(
    () => [
      {
        id: "nav",
        label: dict.nav.views,
        items: [
          { id: "p1", label: dict.nav.board, hint: "G T", onSelect: () => go("/p1") },
          { id: "p2", label: dict.nav.routes, hint: "G R", onSelect: () => go("/p2") },
          {
            id: "p3",
            label: dict.nav.compliance,
            hint: "G C",
            onSelect: () => go("/p3"),
          },
          {
            id: "p4",
            label: dict.nav.infrastructure,
            hint: "G I",
            onSelect: () => go("/p4"),
          },
          { id: "p5", label: dict.nav.demand, hint: "G D", onSelect: () => go("/p5") },
          {
            id: "p6",
            label: dict.nav.planning,
            hint: "G P",
            onSelect: () => go("/p6"),
          },
          {
            id: "p7",
            label: dict.nav.quality,
            hint: "G Q",
            onSelect: () => go("/p7"),
          },
          {
            id: "alerts",
            label: dict.nav.alerts,
            hint: "G A",
            onSelect: () => go("/alertas"),
          },
          {
            id: "scenarios",
            label: dict.nav.scenarios,
            onSelect: () => go("/escenarios"),
          },
        ],
      },
    ],
    [dict, go],
  );

  return (
    <div className={styles.shell}>
      <DemoBanner />
      <TopBar
        globalStatus={globalStatus}
        lastValidated={lastValidated}
        asOfDate={asOfDate}
        breadcrumb={breadcrumb}
      />
      <Cockpit
        rail={
          <NavRail
            alertCount={alertCount}
            onSearch={() => setPaletteOpen(true)}
          />
        }
      >
        {children}
      </Cockpit>
      <BottomTabs />
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
