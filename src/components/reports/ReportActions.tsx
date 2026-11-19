"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReportTable } from "@/domain/reports";
import styles from "./reports.module.css";

type Props = {
  csv: ReportTable;
  fileName: string;
  canExport: boolean;
  deniedNote: string;
  /** Overview card: link to the full report. Full report: print in place. */
  openHref?: string;
  autoPrint?: boolean;
};

function escapeCell(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tableToCsv(table: ReportTable): string {
  const head = table.columns.map((c) => escapeCell(c.label)).join(",");
  const body = table.rows.map((row) =>
    table.columns.map((c) => escapeCell(row[c.key] ?? null)).join(","),
  );
  return [head, ...body].join("\r\n");
}

export function ReportActions({
  csv,
  fileName,
  canExport,
  deniedNote,
  openHref,
  autoPrint = false,
}: Props) {
  useEffect(() => {
    if (!autoPrint || !canExport) return;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, [autoPrint, canExport]);

  function download() {
    // BOM so spreadsheet tools read accents correctly.
    const blob = new Blob(["﻿", tableToCsv(csv)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`${styles.actions} ${styles.noPrint}`}>
      {openHref ? (
        <Link href={openHref} className={styles.actionLink}>
          Generar informe
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
      {canExport ? (
        <>
          <Button size="sm" onClick={download}>
            <Download size={14} strokeWidth={1.75} aria-hidden />
            CSV
          </Button>
          {openHref ? (
            <Link href={`${openHref}?imprimir=1`} className={styles.backLink}>
              <Printer size={14} strokeWidth={1.75} aria-hidden />
              PDF
            </Link>
          ) : (
            <Button size="sm" onClick={() => window.print()}>
              <Printer size={14} strokeWidth={1.75} aria-hidden />
              Imprimir o guardar PDF
            </Button>
          )}
        </>
      ) : (
        <span className={styles.actionNote}>{deniedNote}</span>
      )}
    </div>
  );
}
