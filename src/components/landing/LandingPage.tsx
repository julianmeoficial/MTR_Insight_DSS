"use client";

import Link from "next/link";
import type {
  KpiTileModel,
  LoadFactorSeriesPoint,
} from "@/application/dashboard";
import type { AlertEvent } from "@/domain";
import { LandingAlertInbox } from "@/components/landing/LandingAlertInbox";
import { LandingBoardPreview } from "@/components/landing/LandingBoardPreview";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { LandingNav } from "@/components/landing/LandingNav";
import { DssMiniSimulator } from "@/components/landing/DssMiniSimulator";
import { FanChart } from "@/components/landing/FanChart";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { useDemoSession } from "@/components/providers/DemoSessionProvider";
import { homeForRole } from "@/domain/access";
import styles from "./landing.module.css";

type Props = {
  tiles: KpiTileModel[];
  alerts: readonly AlertEvent[];
  series: LoadFactorSeriesPoint[];
  meta: {
    source: string;
    version: string;
    status: string;
    lastValidated: string;
  };
};

export function LandingPage({ tiles, alerts, series, meta }: Props) {
  const { dict } = usePreferences();
  const { role } = useDemoSession();
  const boardHref = role ? homeForRole(role) : "/login";
  const explainTile = tiles.find((t) => t.kpiId === "K1") ?? tiles[0];

  return (
    <LandingMotion>
      <svg
        className={styles.centerline}
        aria-hidden
        viewBox="0 0 2 1000"
        preserveAspectRatio="none"
      >
        <path
          data-centerline-path
          d="M 1 0 L 1 1000"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <LandingNav />

      <main className={styles.main}>
        <section className={styles.hero} data-hero-stage>
          <div className={styles.heroBackdrop} aria-hidden>
            <div className={styles.heroDusk} />
            <div className={styles.heroRunway} />
          </div>

          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <p className={styles.wayfindingLoc} data-hero-tag>
                {dict.hero.tag}
              </p>
              <h1 className={styles.heroTitle} data-h1>
                {dict.hero.title}
              </h1>
              <p className={styles.heroSub} data-hero-sub>
                {dict.hero.subtitle}
              </p>
              <div className={styles.heroCtas}>
                <Link href={boardHref} className={styles.ctaLg} data-hero-cta>
                  {dict.hero.primary}
                  <span className={styles.ctaArrow} aria-hidden>
                    →
                  </span>
                </Link>
                <a href="#metodo" className={styles.ctaGhost} data-hero-cta>
                  {dict.hero.secondary}
                </a>
              </div>
            </div>

            <div className={styles.stage} data-stage>
              <div className={styles.stageInner}>
                <div className={styles.frame} data-frame>
                  <div className={styles.frameChrome}>
                    <p className={styles.frameLabel}>
                      {dict.landing.productFrameLabel}
                    </p>
                    <span className={styles.frameDemo}>{dict.demo.tag}</span>
                  </div>
                  <div className={styles.frameBody}>
                    <LandingBoardPreview
                      tiles={tiles}
                      series={series}
                      meta={meta}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="metodo"
          className={styles.proof}
          data-proof
          aria-labelledby="proof-heading"
        >
          <div className={styles.proofInner}>
            <h2 id="proof-heading" className={styles.visuallyHidden}>
              {dict.nav.method}
            </h2>
            <div className={styles.facts}>
              <Fact
                label={dict.landing.factRunway}
                value={dict.landing.factRunwayValue}
                source={dict.landing.factRunwaySource}
                verified={dict.landing.verified}
              />
              <Fact
                label={dict.landing.factPax}
                value={dict.landing.factPaxValue}
                source={dict.landing.factPaxSource}
                verified={dict.landing.verified}
              />
              <Fact
                label={dict.landing.factRoute}
                value={dict.landing.factRouteValue}
                source={dict.landing.factRouteSource}
                verified={dict.landing.verified}
              />
            </div>
            <p className={styles.proofFoot}>{dict.landing.proofFootnote}</p>
          </div>
        </section>

        <Chapter
          id="medir"
          tag={dict.chapters.measure.tag}
          title={dict.chapters.measure.title}
          body={dict.chapters.measure.body}
          ui={
            <LandingBoardPreview tiles={tiles} series={series} meta={meta} />
          }
          summary={dict.landing.productFrameSummary}
        />

        <Chapter
          id="detectar"
          tag={dict.chapters.detect.tag}
          title={dict.chapters.detect.title}
          body={dict.chapters.detect.body}
          ui={<LandingAlertInbox alerts={alerts} />}
          summary={dict.landing.alertFragmentSummary}
        />

        <Chapter
          id="explicar"
          tag={dict.chapters.explain.tag}
          title={dict.chapters.explain.title}
          body={dict.chapters.explain.body}
          ui={explainTile ? <ExplainPanel tile={explainTile} /> : null}
          summary={dict.chapters.explain.body}
        />

        <Chapter
          id="simular"
          tag={dict.chapters.simulate.tag}
          title={dict.chapters.simulate.title}
          body={dict.chapters.simulate.body}
          ui={<DssMiniSimulator />}
          summary={dict.chapters.simulate.body}
        />

        <Chapter
          id="proyectar"
          tag={dict.chapters.project.tag}
          title={dict.chapters.project.title}
          body={dict.chapters.project.body}
          ui={<FanChart />}
          summary={dict.chapters.project.body}
        />

        <Chapter
          id="gobernar"
          tag={dict.chapters.govern.tag}
          title={dict.chapters.govern.title}
          body={dict.chapters.govern.body}
          ui={<PipelineFragment />}
          summary={dict.chapters.govern.body}
        />

        <section className={styles.keyboard} aria-labelledby="keyboard-title">
          <div className={styles.chapterInner}>
            <div className={styles.chapterAside}>
              <h2 id="keyboard-title" className={styles.chapterTitle}>
                {dict.chapters.keyboard.title}
              </h2>
              <p className={styles.chapterBody}>{dict.chapters.keyboard.body}</p>
            </div>
            <div className={styles.chapterUi} data-chapter-ui>
              <div className={styles.palette}>
                <span className={styles.paletteKbd}>⌘K</span>
                <span className={styles.paletteText}>
                  {dict.landing.palettePlaceholder}
                </span>
              </div>
              <ul className={styles.shortcutGrid}>
                {dict.landing.shortcuts.map((row) => (
                  <li key={row.keys} className={styles.shortcutRow}>
                    <kbd className={styles.kbdChip}>{row.keys}</kbd>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div className={styles.threshold} aria-hidden>
            <span className={styles.papiLight} data-lit="true" />
            <span className={styles.papiLight} data-lit="true" />
            <span className={styles.papiLight} data-lit="true" />
            <span className={styles.papiLight} data-lit="true" />
          </div>
          <h2 id="final-cta-title" className={styles.finalTitle}>
            {dict.chapters.final.title}
          </h2>
          <Link href={boardHref} className={styles.ctaLg}>
            {dict.chapters.final.cta}
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerAcademic}>{dict.landing.footerAcademic}</p>
          <p className={styles.footerDisclaimer}>
            {dict.landing.footerDisclaimer}
          </p>
          <p className={`num ${styles.footerMeta}`}>
            {dict.landing.footerMeta} · {dict.demo.tag}
          </p>
        </div>
      </footer>
    </LandingMotion>
  );
}

function Chapter({
  id,
  tag,
  title,
  body,
  ui,
  summary,
}: {
  id: string;
  tag: string;
  title: string;
  body: string;
  ui: React.ReactNode;
  summary: string;
}) {
  return (
    <section id={id} className={styles.chapter} aria-labelledby={`${id}-title`}>
      <div className={styles.chapterInner}>
        <div className={styles.chapterAside}>
          <p className={styles.wayfindingDir}>{tag}</p>
          <h2 id={`${id}-title`} className={styles.chapterTitle}>
            {title}
          </h2>
          <p className={styles.chapterBody}>{body}</p>
        </div>
        <div className={styles.chapterUi} data-chapter-ui>
          <p className={styles.visuallyHidden}>{summary}</p>
          {ui}
        </div>
      </div>
    </section>
  );
}

function ExplainPanel({ tile }: { tile: KpiTileModel }) {
  const { dict } = usePreferences();

  return (
    <div className={styles.explain} data-board-card>
      <p className={styles.explainHead}>{dict.kpi.why}</p>
      <dl className={styles.explainGrid}>
        <div>
          <dt>{dict.kpi.formula}</dt>
          <dd className="num">
            {dict.landing.explainSampleNumerator} /{" "}
            {dict.landing.explainSampleDenominator}
          </dd>
        </div>
        <div>
          <dt>{dict.kpi.numerator}</dt>
          <dd className="num">{dict.landing.explainSampleNumerator}</dd>
        </div>
        <div>
          <dt>{dict.kpi.denominator}</dt>
          <dd className="num">{dict.landing.explainSampleDenominator}</dd>
        </div>
        <div>
          <dt>{dict.kpi.threshold}</dt>
          <dd>{dict.landing.explainSampleThreshold}</dd>
        </div>
        <div>
          <dt>{dict.kpi.ruleVersion}</dt>
          <dd className="num">{dict.landing.explainSampleRule}</dd>
        </div>
        <div>
          <dt>{dict.kpi.period}</dt>
          <dd>{tile.subtitle}</dd>
        </div>
      </dl>
    </div>
  );
}

function PipelineFragment() {
  const { dict } = usePreferences();

  return (
    <div className={styles.pipeline} data-board-card>
      <div className={styles.pipelineTrack}>
        <span className={styles.pipelineNode}>{dict.landing.pipelineSources}</span>
        <span className={styles.pipelineLine} aria-hidden />
        <span className={styles.pipelineNode}>{dict.landing.pipelineRules}</span>
        <span className={styles.pipelineLine} aria-hidden />
        <span className={styles.pipelineNode}>
          {dict.landing.pipelineWarehouse}
        </span>
      </div>
      <ul className={styles.rcList}>
        {dict.landing.rcRules.map((rule) => (
          <li key={rule} className={`num ${styles.rcItem}`}>
            {rule}
          </li>
        ))}
      </ul>
      <p className={styles.govNote}>{dict.landing.govNote}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  source,
  verified,
}: {
  label: string;
  value: string;
  source: string;
  verified: string;
}) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={`num ${styles.factValue}`}>{value}</dd>
      <p className={styles.factMeta}>
        <span className={styles.factOk}>{verified}</span> · {source}
      </p>
    </div>
  );
}
