import Link from "next/link";
import { ArrowRight, CircleCheck, CircleDashed } from "lucide-react";
import { calculateK4 } from "@/domain";
import { loadDashboardBundle, loadSituation } from "@/data/fixtures/load-dashboard";
import { RoutePlanner } from "@/components/screens/RoutePlanner";
import { readDemoRole } from "@/application/read-demo-session";
import { canAccessRoute } from "@/domain/access";
import { KpiHeadline } from "@/components/kpi/KpiHeadline";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { fillTemplate, getDictionary } from "@/i18n/dictionaries";
import { formatPct, formatDateIso, formatInt } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";
import p5 from "./p5.module.css";

export const metadata = {
  title: "Demanda regional · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default async function P5Page() {
  const dict = getDictionary("es");
  const t = dict.screenBody.p5;
  const role = await readDemoRole();
  const bundle = loadDashboardBundle();
  const situation = loadSituation();
  const k4 = calculateK4(bundle.demand);
  const { competitors, evidenceChecklist, catchment, period } = bundle.competitors;
  const doneCount = evidenceChecklist.filter((e) => e.done).length;
  const maxShare = Math.max(...competitors.map((c) => c.sharePct));

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P5`}
          title={dict.screens.p5.title}
          question={dict.screens.p5.question}
        />
      </div>

      <KpiHeadline code="K4" label={t.kpiLabel} value={k4.value} status={k4.status}>
        {fillTemplate(t.meta, {
          dep: formatInt(bundle.demand.directInternationalDeparturesFromMtr),
          trav: formatInt(bundle.demand.catchmentInternationalTravelers),
        })}
      </KpiHeadline>

      <section className={views.statStrip}>
        <div className={views.stat}>
          <span className={views.statLabel}>{t.catchment}</span>
          <span className={p5.statText}>{catchment}</span>
        </div>
        <div className={views.stat}>
          <span className={views.statLabel}>{t.period}</span>
          <span className={`num ${p5.statText}`}>
            {formatDateIso(period.start)} · {formatDateIso(period.end)}
          </span>
        </div>
      </section>

      <div className={styles.dual}>
        <figure className={views.section}>
          <figcaption className={views.sectionTitle}>{t.mapTitle}</figcaption>
          <svg
            viewBox="0 0 320 150"
            className={p5.map}
            role="img"
            aria-label={t.mapAria}
          >
            <path
              d="M58 104 C 140 24, 200 22, 262 54"
              className={p5.arc}
              pathLength={1}
            />
            <circle cx="58" cy="104" r="5" className={p5.nodeOrigin} />
            <circle cx="262" cy="54" r="5" className={p5.nodeDest} />
            <text x="58" y="128" textAnchor="middle" className={p5.label}>
              MTR
            </text>
            <text x="262" y="38" textAnchor="middle" className={p5.label}>
              PTY
            </text>
          </svg>
          <p className={views.hint}>{t.mapNote}</p>
        </figure>

        <section className={views.section}>
          <div>
            <h2 className={views.sectionTitle}>{t.competitorsTitle}</h2>
            <p className={views.hint}>{t.competitorsHint}</p>
          </div>
          <ul className={p5.bars}>
            {competitors.map((c) => (
              <li key={c.airport} className={p5.bar}>
                <div className={p5.barHead}>
                  <span>
                    {c.label} <span className={views.codeMuted}>{c.airport}</span>
                  </span>
                  <span className="num">{formatPct(c.sharePct)}</span>
                </div>
                <div className={p5.track} aria-hidden>
                  <span
                    className={p5.fill}
                    data-self={c.airport === "MTR" ? "true" : undefined}
                    style={{ inlineSize: `${(c.sharePct / maxShare) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={views.section}>
        <div className={views.sectionHead}>
          <h2 className={views.sectionTitle}>{t.evidenceTitle}</h2>
          <span className={views.chip}>
            {fillTemplate(t.evidenceDone, {
              done: doneCount,
              total: evidenceChecklist.length,
            })}
          </span>
        </div>
        <ul className={p5.evidence}>
          {evidenceChecklist.map((item) => (
            <li key={item.id} className={p5.evidenceItem} data-done={item.done ? "true" : undefined}>
              {item.done ? (
                <CircleCheck size={16} strokeWidth={1.5} aria-label={t.done} />
              ) : (
                <CircleDashed size={16} strokeWidth={1.5} aria-label={t.pending} />
              )}
              <span className={views.codeMuted}>{item.id}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
        {role && canAccessRoute(role, "/situacion") ? (
          <Link href="/situacion" className={views.inlineLink}>
            {t.toSituation}
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        ) : null}
      </section>

      <RoutePlanner
        origin={situation.origin}
        airports={situation.airports}
        routes={situation.routes}
        constraints={situation.constraints}
        canValidate={role ? canAccessRoute(role, "/validador") : false}
      />

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
