"use client";

import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import {
  Button,
  Card,
  CommandPalette,
  Drawer,
  EmptyState,
  ErrorState,
  IconButton,
  Kbd,
  NoDataState,
  PapiLoader,
  Row,
  SegmentedControl,
  Skeleton,
  StaleState,
  StatusPill,
  Tooltip,
  WayfindingTag,
} from "@/components/ui";
import styles from "./ui-playground.module.css";

export function UiPrimitivesPlayground() {
  const { dict, theme, toggleTheme } = usePreferences();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [segment, setSegment] = useState<"a" | "b">("a");

  return (
    <div className={styles.page} data-theme={theme}>
      <header className={styles.header}>
        <div>
          <WayfindingTag variant="location">MTR · SKMR</WayfindingTag>
          <h1 className={styles.title}>Primitivos UI · fase 2</h1>
          <p className={styles.lead}>
            Catálogo de desarrollo. Tema actual: {theme}.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Cambiar tema
          </Button>
          <Tooltip label={dict.demo.tooltip}>
            <IconButton label="Ajustes de demo">
              <Settings strokeWidth={1.5} aria-hidden />
            </IconButton>
          </Tooltip>
        </div>
      </header>

      <CommandPalette
        placeholder="Buscar acción…"
        emptyLabel={dict.states.empty}
        closeLabel="Cerrar"
        groups={[
          {
            id: "nav",
            label: "Navegación",
            items: [
              {
                id: "p1",
                label: dict.nav.board,
                hint: "G T",
                onSelect: () => undefined,
              },
            ],
          },
        ]}
      />

      <section className={styles.grid}>
        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Botones</h2>
          <div className={styles.row}>
            <Button variant="primary" size="md">
              Primario
            </Button>
            <Button variant="secondary" size="md">
              Secundario
            </Button>
            <Button variant="ghost" size="sm">
              Fantasma
            </Button>
            <IconButton label="Buscar">
              <Search strokeWidth={1.5} aria-hidden />
            </IconButton>
          </div>
          <p className={styles.meta}>
            Paleta: <Kbd>⌘</Kbd> <Kbd>K</Kbd>
          </p>
        </Card>

        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Estado y señales</h2>
          <div className={styles.row}>
            <StatusPill tone="ok" label={dict.status.ok} />
            <StatusPill tone="warn" label={dict.status.warn} />
            <StatusPill tone="crit" label={dict.status.crit} />
            <StatusPill tone="nodata" label={dict.status.nodata} />
          </div>
          <div className={styles.row}>
            <WayfindingTag variant="direction">1.0 Medir →</WayfindingTag>
            <PapiLoader label={dict.states.loading} />
          </div>
          <SegmentedControl
            ariaLabel="Ejemplo"
            value={segment}
            onChange={setSegment}
            options={[
              { value: "a", label: "Opción A" },
              { value: "b", label: "Opción B" },
            ]}
          />
        </Card>

        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Lista</h2>
          <Row
            title="Load factor semanal"
            code="K1"
            meta="Semana 12"
            owner="Operaciones"
            time="09:30"
            status={<StatusPill tone="warn" label={dict.status.warn} />}
          />
        </Card>

        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Carga y vacíos</h2>
          <Skeleton height="var(--s-4)" width="60%" />
          <Skeleton height="var(--s-8)" width="100%" className={styles.skelGap} />
          <EmptyState
            title={dict.states.empty}
            body={dict.alerts.empty}
            actionLabel={dict.states.emptyAction}
            onAction={() => undefined}
            shortcutHint={
              <>
                <Kbd>F</Kbd> filtrar
              </>
            }
          />
        </Card>

        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Errores y datos</h2>
          <ErrorState
            title="Error de carga"
            body={dict.states.error}
            retryLabel="Reintentar"
            onRetry={() => undefined}
          />
          <NoDataState title="Sin datos" body={dict.states.noData} />
          <StaleState title={dict.status.stale} body={dict.states.stale} />
        </Card>

        <Card className={styles.cardPad}>
          <h2 className={styles.sectionTitle}>Drawer</h2>
          <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
            Abrir panel
          </Button>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Detalle"
          >
            <p className={styles.lead}>{dict.states.partial}</p>
          </Drawer>
        </Card>
      </section>
    </div>
  );
}
