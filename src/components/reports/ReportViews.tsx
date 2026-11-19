import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type {
  AnyReport,
  CapacityReport,
  CommercialReport,
  ComplianceReport,
  RiskItem,
} from "@/domain/reports";
import { CLASS_LABEL } from "@/domain/reports";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusPill, trafficLightToTone } from "@/components/ui/StatusPill";
import { formatDateIso, formatInt, formatPct, formatPp, statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ReportActions } from "./ReportActions";
import {
  DecisionList,
  KpiStrip,
  LimitsList,
  RankingBars,
  Sparkline,
  UtilizationChart,
} from "./ReportParts";
import styles from "./reports.module.css";

type ExportProps = { canExport: boolean; deniedNote: string };

const STATE_LABEL: Record<RiskItem["state"], string> = {
  vencido: "Vencido",
  por_vencer: "Por vencer",
  sin_evidencia: "Sin evidencia",
  no_cargada: "No cargada",
  rechazos: "Con rechazos",
  al_dia: "Al día",
};

function fileName(report: AnyReport) {
  return `mtr-informe-${report.id}.csv`;
}

/* ---------- Overview card ---------- */

export function ReportCard({ report, canExport, deniedNote }: { report: AnyReport } & ExportProps) {
  return (
    <article className={styles.card} aria-labelledby={`card-${report.id}`}>
      <header className={styles.cardHead}>
        <div>
          <p className={styles.area}>{report.area}</p>
          <h2 id={`card-${report.id}`} className={styles.cardTitle}>
            {report.title}
          </h2>
          <p className={styles.question}>{report.question}</p>
        </div>
        <StatusPill tone={trafficLightToTone(report.status)} label={statusLabel(report.status)} />
      </header>
      <p className={styles.headline}>{report.headline}</p>
      <KpiStrip kpis={report.kpis} />
      <CardEvidence report={report} />
      <section aria-label="Decisiones principales">
        <h3 className={styles.sectionTitle} style={{ fontSize: 14, marginBottom: 8 }}>
          Decisiones principales
        </h3>
        <DecisionList decisions={report.decisions.slice(0, 2)} compact />
      </section>
      <ReportActions
        csv={report.csv}
        fileName={fileName(report)}
        canExport={canExport}
        deniedNote={deniedNote}
        openHref={`/reportes/${report.id}`}
      />
    </article>
  );
}

function CardEvidence({ report }: { report: AnyReport }) {
  switch (report.id) {
    case "comercial":
      return <RankingBars rows={report.rows} compact />;
    case "capacidad":
      return <UtilizationChart series={report.series} />;
    case "cumplimiento":
      return <RiskMiniList items={report.items.filter((i) => i.score > 0).slice(0, 4)} />;
  }
}

function RiskMiniList({ items }: { items: RiskItem[] }) {
  return (
    <ul className={styles.decisions} aria-label="Asuntos abiertos">
      {items.map((i) => (
        <li key={i.id} className={styles.decision} style={{ gridTemplateColumns: "1fr" }}>
          <p className={styles.decisionTitle}>
            <StatusPill tone={trafficLightToTone(i.status)} label={STATE_LABEL[i.state]} />
            {i.label}
            <span className={styles.cellMuted}>· {i.authority}</span>
          </p>
          <p className={styles.decisionEvidence}>{i.impact}</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Full report document ---------- */

export function ReportDocument({
  report,
  canExport,
  deniedNote,
  autoPrint,
  datasetLine,
}: { report: AnyReport; autoPrint: boolean; datasetLine: string } & ExportProps) {
  return (
    <main className={cn(styles.doc)}>
      <div style={{ padding: "16px 16px 0" }} className={styles.noPrint}>
        <Link href="/reportes" className={styles.backLink}>
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          Todos los informes
        </Link>
      </div>
      <div style={{ padding: "8px 16px 20px" }}>
        <ScreenHeader eyebrow={`Informe · ${report.area}`} title={report.title} question={report.question}>
          <StatusPill tone={trafficLightToTone(report.status)} label={statusLabel(report.status)} />
        </ScreenHeader>
        <p className={styles.printOnly} style={{ fontSize: 12, marginTop: 8 }}>
          MTR Insight · Aeropuerto Los Garzones (SKMR) · {report.periodLabel} · {datasetLine}
        </p>
      </div>

      <section className={styles.docSection} aria-label="Resumen">
        <p className={styles.headline} style={{ fontSize: 16 }}>
          {report.headline}
        </p>
        <p className={styles.sectionHint}>Periodo: {report.periodLabel}</p>
        <KpiStrip kpis={report.kpis} wide />
        <ReportActions
          csv={report.csv}
          fileName={fileName(report)}
          canExport={canExport}
          deniedNote={deniedNote}
          autoPrint={autoPrint}
        />
      </section>

      <section className={styles.docSection} aria-labelledby="decisiones">
        <div>
          <h2 id="decisiones" className={styles.sectionTitle}>
            Decisiones recomendadas
          </h2>
          <p className={styles.sectionHint}>
            Ordenadas por prioridad. Cada una trae la evidencia, la acción y el responsable. La decisión final es de la gerencia.
          </p>
        </div>
        <DecisionList decisions={report.decisions} />
      </section>

      <Evidence report={report} />

      <section className={styles.docSection} aria-labelledby="limites">
        <h2 id="limites" className={styles.sectionTitle}>
          Lo que este informe no permite decidir
        </h2>
        <LimitsList limits={report.limits} />
        <p className={styles.provenance}>
          Generado desde: {report.generatedFrom.join(" · ")} · {datasetLine}
        </p>
      </section>
    </main>
  );
}

function Evidence({ report }: { report: AnyReport }) {
  switch (report.id) {
    case "comercial":
      return <CommercialEvidence report={report} />;
    case "capacidad":
      return <CapacityEvidence report={report} />;
    case "cumplimiento":
      return <ComplianceEvidence report={report} />;
  }
}

function MiniRank({ title, rows, empty }: { title: string; rows: CommercialReport["rows"]; empty: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle} style={{ fontSize: 14, marginBottom: 6 }}>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className={styles.sectionHint}>{empty}</p>
      ) : (
        <ol className={styles.limits}>
          {rows.map((r) => (
            <li key={r.key}>
              <strong>{r.route}</strong> {r.operator} · {formatPct(r.loadFactor)} ·{" "}
              {formatInt(r.paxPerFlight)} pax/vuelo
              {r.ageWeeks !== null ? ` · ${r.ageWeeks} semanas` : ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CommercialEvidence({ report }: { report: CommercialReport }) {
  return (
    <>
      <section className={styles.docSection} aria-labelledby="ranking">
        <div>
          <h2 id="ranking" className={styles.sectionTitle}>
            Más y menos ocupadas
          </h2>
          <p className={styles.sectionHint}>
            Las rutas nuevas (menos de {report.maturationWeeks} semanas) se muestran aparte y no entran en la lista de recorte.
          </p>
        </div>
        <div className={styles.docGrid}>
          <RankingBars rows={report.rows} />
          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <MiniRank title="Más ocupadas (rutas maduras)" rows={report.top} empty="Sin datos." />
            <MiniRank title="Menos ocupadas (rutas maduras)" rows={report.bottom} empty="Sin datos." />
            <MiniRank title="En maduración: no recortar todavía" rows={report.maturing} empty="No hay rutas nuevas en la ventana." />
          </div>
        </div>
      </section>
      <section className={styles.docSection} aria-labelledby="detalle">
        <h2 id="detalle" className={styles.sectionTitle}>
          Detalle por ruta y operador
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Ruta</th>
                <th>Operador</th>
                <th className={styles.num}>Pax</th>
                <th className={styles.num}>Sillas vacías</th>
                <th className={styles.num}>Ocupación</th>
                <th>Semanal</th>
                <th className={styles.num}>Tendencia</th>
                <th>Decisión</th>
                <th>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={r.key}>
                  <td className={cn(styles.num, styles.cellMuted)}>{i + 1}</td>
                  <td>
                    {r.route}
                    <span className={styles.cellMuted}> · {r.city}</span>
                  </td>
                  <td>
                    {r.operator}
                    <span className={styles.cellMuted}> · {r.aircraftType}</span>
                    {!r.dataVerified ? <span className={styles.unverified}>Dato sin conciliar</span> : null}
                  </td>
                  <td className={styles.num}>{formatInt(r.passengers)}</td>
                  <td className={styles.num}>{formatInt(r.emptySeats)}</td>
                  <td className={styles.num}>{formatPct(r.loadFactor)}</td>
                  <td>
                    <Sparkline values={r.weekly} />
                  </td>
                  <td className={styles.num}>{formatPp(r.trendPp)}</td>
                  <td>
                    <span className={styles.tag} data-class={r.routeClass}>
                      {CLASS_LABEL[r.routeClass]}
                    </span>
                  </td>
                  <td className={styles.cellWide}>{r.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.sectionHint}>
          Tendencia: ocupación de las últimas 3 semanas menos la de las primeras 3. Corte: {formatDateIso(report.cutoff)}.
        </p>
      </section>
    </>
  );
}

function CapacityEvidence({ report }: { report: CapacityReport }) {
  return (
    <>
      <section className={styles.docSection} aria-labelledby="proyeccion">
        <div>
          <h2 id="proyeccion" className={styles.sectionTitle}>
            ¿Cuándo se llena la terminal?
          </h2>
          <p className={styles.sectionHint}>
            Base {report.baseYear}: {formatInt(report.passengers12m)} pax en 12 meses sobre {formatInt(report.capacity)} de capacidad declarada. Plazo de diseño y obra: {report.leadTimeYears} años (supuesto).
          </p>
        </div>
        <div className={styles.docGrid}>
          <UtilizationChart series={report.series} />
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minInlineSize: "26rem" }}>
              <thead>
                <tr>
                  <th>Escenario</th>
                  <th className={styles.num}>80 % planear</th>
                  <th className={styles.num}>90 % ejecutar</th>
                  <th className={styles.num}>Saturación</th>
                  <th className={styles.num}>Decidir antes de</th>
                </tr>
              </thead>
              <tbody>
                {report.scenarios.map((s) => (
                  <tr key={s.id}>
                    <td>{s.label}</td>
                    <td className={styles.num}>{s.year80 === report.baseYear ? "Ya" : (s.year80 ?? "> 2045")}</td>
                    <td className={styles.num}>{s.year90 ?? "> 2045"}</td>
                    <td className={styles.num}>{s.year100 ?? "> 2045"}</td>
                    <td className={styles.num}>
                      <strong>{s.decideBy ?? "n/d"}</strong>
                      {s.decideBy === report.baseYear ? <span className={styles.unverified}>Este año</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {report.options.length > 0 ? (
        <section className={styles.docSection} aria-labelledby="opciones">
          <div>
            <h2 id="opciones" className={styles.sectionTitle}>
              ¿De qué tamaño ampliar? Capacidad vacía al abrir
            </h2>
            <p className={styles.sectionHint}>
              Ambas opciones abren en {report.options[0]!.openYear}, el año de saturación del escenario base. Capacidad del plan simulado de Terminal 2.
            </p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Opción</th>
                  <th className={styles.num}>Capacidad añadida</th>
                  <th className={styles.num}>Utilización al abrir</th>
                  <th className={styles.num}>Capacidad sin usar</th>
                  <th className={styles.num}>Años hasta 80 %</th>
                  <th>Lectura</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>No ampliar</td>
                  <td className={styles.num}>0</td>
                  <td className={styles.num}>100 %</td>
                  <td className={styles.num}>0</td>
                  <td className={styles.num}>n/d</td>
                  <td className={styles.cellWide}>Demanda rechazada desde el año de saturación: pérdida de ingresos y de rutas.</td>
                </tr>
                {report.options.map((o) => (
                  <tr key={o.id}>
                    <td>{o.label}</td>
                    <td className={styles.num}>{formatInt(o.addedCapacity)}</td>
                    <td className={styles.num}>{formatPct(o.utilizationAtOpen)}</td>
                    <td className={styles.num}>{formatInt(o.idleAtOpen)} pax/año</td>
                    <td className={styles.num}>{o.yearsUntil80 ?? "> 2045"}</td>
                    <td className={styles.cellWide}>{o.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className={styles.docSection} aria-labelledby="bodegas">
        <h2 id="bodegas" className={styles.sectionTitle}>
          Bodegas de carga
        </h2>
        <ul className={styles.limits}>
          {report.warehouses.map((w) => (
            <li key={w.operator}>
              {w.operator}: {w.warehouses.join(", ")} · ocupación sin medir
            </li>
          ))}
        </ul>
        <p className={styles.sectionHint}>
          Una bodega cuesta lo mismo llena que medio vacía. Sin m² ocupados ni rotación, el informe no recomienda ampliar ni liberar espacio: recomienda medir.
        </p>
      </section>
    </>
  );
}

function ComplianceEvidence({ report }: { report: ComplianceReport }) {
  return (
    <section className={styles.docSection} aria-labelledby="riesgos">
      <div>
        <h2 id="riesgos" className={styles.sectionTitle}>
          Matriz de riesgo priorizada
        </h2>
        <p className={styles.sectionHint}>
          Requisitos y fuentes de dato en una sola lista. Corte {formatDateIso(report.asOf)}. Prioridad: crítico y vencido primero.
        </p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.num}>Prioridad</th>
              <th>Elemento</th>
              <th>Estado</th>
              <th>Fecha límite</th>
              <th className={styles.num}>Días</th>
              <th>Responsable</th>
              <th>Impacto</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((i) => (
              <tr key={i.id}>
                <td className={styles.num}>{i.score}</td>
                <td>
                  {i.label}
                  <span className={styles.cellMuted}>
                    {" "}
                    · {i.authority}
                    {i.critical && i.kind === "requisito" ? " · crítico" : ""}
                  </span>
                </td>
                <td>
                  <StatusPill tone={trafficLightToTone(i.status)} label={STATE_LABEL[i.state]} />
                </td>
                <td className="num">{i.dueDate ? formatDateIso(i.dueDate) : "n/d"}</td>
                <td className={styles.num}>{i.daysToDue ?? "n/d"}</td>
                <td>{i.owner}</td>
                <td className={styles.cellWide}>{i.impact}</td>
                <td className={styles.cellWide}>{i.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
