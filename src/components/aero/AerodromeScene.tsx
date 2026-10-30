"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Maximize2, Map as MapIcon, Building2 } from "lucide-react";
import type { RunwayRef, TerminalRef } from "@/domain/erpm";
import { AerodromeDiagram } from "@/components/aero/AerodromeDiagram";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { PapiLoader } from "@/components/ui/PapiLoader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatInt, formatPct } from "@/lib/format";
import type {
  AerodromeStatus,
  AerodromeView,
  AerodromeVolumeId,
} from "./AerodromeCanvas";
import styles from "./AerodromeScene.module.css";

const AerodromeCanvas = dynamic(
  () => import("./AerodromeCanvas").then((m) => m.AerodromeCanvas),
  { ssr: false },
);

export type AerodromeSidecarData = {
  utilizationRatio: number | null;
  headroom80: number;
  headroom90: number;
  h1Operations: number | null;
  cargoOperators: readonly { label: string; warehouses: readonly string[] }[];
  expansionNote: string;
};

type Props = {
  runways: RunwayRef[];
  terminals: TerminalRef[];
  /** When set, the parent owns Actual/Ampliación (validator). */
  showProjected?: boolean;
  onShowProjectedChange?: (show: boolean) => void;
  showConfigToolbar?: boolean;
  /** Assigned runway/terminal to outline (validator) */
  highlight?: AerodromeVolumeId;
  sidecar: AerodromeSidecarData;
};

const VIEW_ICONS = { overview: Maximize2, plan: MapIcon, landside: Building2 } as const;

/**
 * Aerodrome viewer: Three.js scene built from the infrastructure data, with
 * view presets, sign tags and an HTML sidecar for every number. Falls back
 * to the SVG chart under reduced motion or when WebGL is not available.
 */
export function AerodromeScene({
  runways,
  terminals,
  showProjected: controlledProjected,
  onShowProjectedChange,
  showConfigToolbar = true,
  highlight,
  sidecar,
}: Props) {
  const { dict } = usePreferences();
  const t = dict.aerodrome;
  const reduced = usePrefersReducedMotion();
  const [internalProjected, setInternalProjected] = useState(false);
  const [picked, setPicked] = useState<AerodromeVolumeId>(null);
  const [view, setView] = useState<AerodromeView>("overview");
  const [status, setStatus] = useState<AerodromeStatus>("loading");

  const showProjected = controlledProjected ?? internalProjected;
  const selected = picked ?? highlight ?? null;

  function setProjected(next: boolean) {
    if (controlledProjected === undefined) setInternalProjected(next);
    onShowProjectedChange?.(next);
  }

  const cargoWarehouses = useMemo(
    () => sidecar.cargoOperators.flatMap((o) => o.warehouses),
    [sidecar.cargoOperators],
  );
  const tags = useMemo(
    () => ({
      rwy1: `RWY ${runways.find((r) => r.id === "RWY1")?.designator ?? ""}`,
      rwy2: `RWY ${runways.find((r) => r.id === "RWY2")?.designator ?? ""}`,
      t1: "T1",
      t2: "T2",
      cargo: t.cargoTag,
      tower: t.towerTag,
      hub: t.hubTag,
      support: t.supportTag,
    }),
    [runways, t.cargoTag, t.towerTag, t.hubTag, t.supportTag],
  );
  const onStatus = useCallback((s: AerodromeStatus) => setStatus(s), []);
  const useSvg = reduced || status === "error";

  const rwy = (id: "RWY1" | "RWY2") => runways.find((r) => r.id === id);
  const term = (id: "T1" | "T2") => terminals.find((x) => x.id === id);

  function details(): { title: string; facts: [string, string][]; note?: string; prose?: boolean } {
    switch (selected) {
      case "rwy1":
      case "rwy2": {
        const r = rwy(selected === "rwy1" ? "RWY1" : "RWY2");
        if (!r) break;
        return {
          title: `RWY ${r.designator}`,
          facts: [
            [t.length, `${formatInt(r.lengthM)} m`],
            [t.width, `${formatInt(r.widthM)} m`],
            [t.pcn, r.pcn === null ? "n/d" : `PCN ${r.pcn}`],
            [t.approach, dict.validator.approach[r.approach]],
          ],
          note: r.evidence.source,
        };
      }
      case "t1":
      case "t2": {
        const x = term(selected === "t1" ? "T1" : "T2");
        if (!x) break;
        return {
          title: x.name,
          facts: [
            [t.capacity, `${formatInt(x.annualCapacity)} pax`],
            [t.codeLetter, x.maxCodeLetter],
            [t.widebody, formatInt(x.widebodyStands)],
            [t.border, x.international ? t.yes : t.no],
          ],
          note: x.evidence.source,
        };
      }
      case "cargo":
        return {
          title: t.cargoBlock,
          facts: sidecar.cargoOperators.map((op) => [op.label, op.warehouses.join(" · ")]),
          note: t.cargoNote,
        };
      case "tower":
        return { title: t.towerTag, facts: [], note: t.towerNote };
      case "hub": {
        const f = t.hubFacts;
        return {
          title: t.hubTag,
          facts: [
            [f.link, f.linkValue],
            [f.access, f.accessValue],
            [f.taxis, f.taxisValue],
            [f.parking, f.parkingValue],
            [f.cargo, f.cargoValue],
          ],
          note: t.hubNote,
          prose: true,
        };
      }
      case "support": {
        const f = t.supportFacts;
        return {
          title: t.supportTag,
          facts: [
            [f.mro, f.mroValue],
            [f.fuel, f.fuelValue],
            [f.arff, f.arffValue],
            [f.link, f.linkValue],
          ],
          note: t.supportNote,
          prose: true,
        };
      }
      default:
        break;
    }
    return { title: t.title, facts: [] };
  }
  const info = details();

  return (
    <div className={styles.container}>
    <div className={styles.root}>
      <div className={styles.stage}>
        <div className={styles.toolbar}>
          {showConfigToolbar ? (
            <SegmentedControl
              ariaLabel={t.configAria}
              value={showProjected ? "expansion" : "current"}
              onChange={(v) => setProjected(v === "expansion")}
              options={[
                { value: "current", label: t.current },
                { value: "expansion", label: t.expansion },
              ]}
            />
          ) : null}
          {!useSvg ? (
            <div className={styles.views} role="group" aria-label={t.viewsAria}>
              {(["overview", "plan", "landside"] as const).map((v) => {
                const Icon = VIEW_ICONS[v];
                return (
                  <button
                    key={v}
                    type="button"
                    className={styles.viewBtn}
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                  >
                    <Icon size={14} strokeWidth={1.5} aria-hidden />
                    {t.views[v]}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {useSvg ? (
          <div className={styles.fallback}>
            <AerodromeDiagram
              runways={runways}
              terminals={terminals}
              showProjected={showProjected}
            />
            {status === "error" ? <p className={styles.fallbackNote}>{t.webglError}</p> : null}
          </div>
        ) : (
          <div className={styles.viewport}>
            <AerodromeCanvas
              runways={runways}
              terminals={terminals}
              cargoWarehouses={cargoWarehouses}
              showProjected={showProjected}
              highlight={selected}
              view={view}
              onSelect={setPicked}
              onStatus={onStatus}
              tags={tags}
            />
            {status === "loading" ? (
              <div className={styles.loading}>
                <PapiLoader label={t.loading} />
                <span>{t.loading}</span>
              </div>
            ) : null}
            <p className={styles.gesture}>{t.gesture}</p>
          </div>
        )}

        <ul className={styles.legend} aria-label={t.legendAria}>
          <li className={styles.legendItem}>
            <span className={styles.swatch} data-tone="runway" />
            {t.legendRunway}
          </li>
          <li className={styles.legendItem}>
            <span className={styles.swatch} data-tone="apron" />
            {t.legendApron}
          </li>
          <li className={styles.legendItem}>
            <span className={styles.swatch} data-tone="terminal" />
            {t.legendTerminal}
          </li>
          <li className={styles.legendItem}>
            <span className={styles.swatch} data-tone="cargo" />
            {t.legendCargo}
          </li>
          {showProjected ? (
            <li className={styles.legendItem}>
              <span className={styles.swatch} data-tone="projected" />
              {t.legendProjected}
            </li>
          ) : null}
        </ul>
      </div>

      <aside className={styles.sidecar} aria-live="polite">
        <div>
          <h3 className={styles.sidecarTitle}>{info.title}</h3>
          <p className={styles.sidecarHint}>{selected ? info.note : t.selectHint}</p>
        </div>
        {info.facts.length > 0 ? (
          <dl className={styles.facts} data-prose={info.prose ? "true" : undefined}>
            {info.facts.map(([k, v]) => (
              <div key={k} className={styles.fact}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className={styles.divider} />
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{t.utilization}</dt>
            <dd>
              {sidecar.utilizationRatio === null ? "n/d" : formatPct(sidecar.utilizationRatio)}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>
              {t.headroom80}
              {sidecar.headroom80 < 0 ? ` · ${t.exceeded}` : ""}
            </dt>
            <dd>
              {formatInt(Math.abs(sidecar.headroom80))}
              <span className={styles.unit}>{t.paxUnit}</span>
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{t.headroom90}</dt>
            <dd>
              {formatInt(Math.abs(sidecar.headroom90))}
              <span className={styles.unit}>{t.paxUnit}</span>
            </dd>
          </div>
          {sidecar.h1Operations !== null ? (
            <div className={styles.fact}>
              <dt>{t.h1Ops}</dt>
              <dd>
                {formatInt(sidecar.h1Operations)}
                <span className={styles.unit}>{t.opsUnit}</span>
              </dd>
            </div>
          ) : null}
        </dl>
        {showProjected ? <p className={styles.sidecarHint}>{sidecar.expansionNote}</p> : null}
      </aside>
    </div>
    </div>
  );
}
