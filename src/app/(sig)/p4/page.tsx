import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { calculateK3 } from "@/domain";
import { kpiThresholds } from "@/config/thresholds";
import { loadDashboardBundle, loadSituation } from "@/data/fixtures/load-dashboard";
import { AerodromeScene } from "@/components/aero/AerodromeScene";
import { readDemoRole } from "@/application/read-demo-session";
import { canAccessRoute } from "@/domain/access";
import { KpiHeadline } from "@/components/kpi/KpiHeadline";
import { CountUp } from "@/components/motion/CountUp";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { StatusPill } from "@/components/ui/StatusPill";
import { fillTemplate, getDictionary } from "@/i18n/dictionaries";
import { formatInt, formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Infraestructura · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default async function P4Page() {
  const dict = getDictionary("es");
  const t = dict.screenBody.p4;
  const a = dict.aerodrome;
  const role = await readDemoRole();
  const bundle = loadDashboardBundle();
  const k3 = calculateK3(bundle.capacity);
  const { runway, runwayConflict, terminal } = bundle.infrastructure;
  const { rolling12MonthPassengers: pax, declaredAnnualCapacity: cap } =
    bundle.capacity;
  const headroom80 = cap * kpiThresholds.K3.greenBelow - pax;
  const headroom90 = cap * kpiThresholds.K3.redMin - pax;
  const situation = loadSituation();

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P4`}
          title={dict.screens.p4.title}
          question={dict.screens.p4.question}
        />
      </div>

      <KpiHeadline code="K3" label={t.kpiLabel} value={k3.value} status={k3.status}>
        {fillTemplate(t.meta, { pax: formatInt(pax), cap: formatInt(cap) })}
      </KpiHeadline>

      <section className={views.statStrip} aria-label={t.kpiLabel}>
        {[
          { label: t.pax12, value: pax },
          { label: t.capacity, value: cap },
          { label: t.headroom80, value: headroom80 },
          { label: t.headroom90, value: headroom90 },
        ].map((item) => (
          <div key={item.label} className={views.stat}>
            <span className={views.statLabel}>
              {item.label}
              {item.value < 0 ? ` · ${t.exceeded}` : ""}
            </span>
            <span className={views.statValue}>
              <CountUp value={Math.abs(item.value)} mode="int" />
              <span className={views.unit}>{t.paxUnit}</span>
            </span>
          </div>
        ))}
      </section>

      <section className={views.section}>
        <div className={views.sectionHead}>
          <div>
            <h2 className={views.sectionTitle}>{a.title}</h2>
            <p className={views.hint}>{t.planHint}</p>
          </div>
        </div>
        <AerodromeScene
          runways={situation.infrastructure.runways}
          terminals={situation.infrastructure.terminals}
          showConfigToolbar
          sidecar={{
            utilizationRatio: k3.value,
            headroom80,
            headroom90,
            h1Operations: bundle.semesterH1.operations,
            cargoOperators: bundle.cargo.operators.map((op) => ({
              label: op.label,
              warehouses: op.warehouses,
            })),
            expansionNote: a.expansionNote,
          }}
        />
      </section>

      <section className={views.section}>
        <div className={views.sectionHead}>
          <h2 className={views.sectionTitle}>{a.cargo}</h2>
          <span className={views.codeMuted}>{bundle.cargo.source}</span>
        </div>
        <dl className={views.facts}>
          {bundle.cargo.operators.map((op) => (
            <div key={op.id} className={views.fact}>
              <dt>{op.label}</dt>
              <dd className="num">{op.warehouses.join(" · ")}</dd>
            </div>
          ))}
        </dl>
        <p className={views.hint}>{bundle.cargo.note}</p>
      </section>

      <div className={styles.dual}>
        <article className={views.section}>
          <div className={views.sectionHead}>
            <h2 className={views.sectionTitle}>{t.runwayTitle}</h2>
            <span className={views.codeMuted}>{runway.designator}</span>
          </div>
          <dl className={views.facts}>
            <div className={views.fact}>
              <dt>{t.verified}</dt>
              <dd>
                <span className={views.statValue}>
                  <CountUp value={runway.lengthM} mode="int" />
                  <span className={views.unit}>m</span>
                </span>
              </dd>
            </div>
            <div className={views.fact}>
              <dt>{t.conflictNote}</dt>
              <dd>
                <span className={views.statValue} data-muted="true">
                  <CountUp value={runwayConflict.lengthM} mode="int" />
                  <span className={views.unit}>m</span>
                </span>
              </dd>
            </div>
          </dl>
          <p className={views.provenance}>
            <StatusPill tone="ok" label={t.verified} />
            <span>{runway.source}</span>
            <span className={views.dot} aria-hidden>
              ·
            </span>
            <span className="num">{formatDateIso(runway.verifiedOn)}</span>
          </p>
          <p className={views.provenance}>
            <StatusPill tone="warn" label={t.conflicting} />
            <span>
              {runwayConflict.source}. {runwayConflict.note}
            </span>
          </p>
        </article>

        <article className={views.section}>
          <h2 className={views.sectionTitle}>{t.terminalTitle}</h2>
          <p className={views.statValue}>
            <CountUp value={terminal.declaredAnnualCapacity} mode="int" />
            <span className={views.unit}>{t.terminalUnit}</span>
          </p>
          <p className={views.provenance}>
            <StatusPill tone="nodata" label={t.pending} />
            <span>{terminal.source}</span>
          </p>
          <p className={views.hint}>{t.runwayDisclaimer}</p>
          {role && canAccessRoute(role, "/validador") ? (
            <Link href="/validador" className={views.inlineLink}>
              {t.toValidator}
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Link>
          ) : null}
        </article>
      </div>

      <footer className={views.footer}>
        <ProvenanceLine
          source={bundle.meta.fuente}
          datasetVersion={bundle.meta.version}
          verificationStatus={bundle.meta.verificationStatus}
          lastValidated={formatDateIso(bundle.meta.lastValidated)}
        />
      </footer>
    </main>
  );
}
