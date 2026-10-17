import type { ScreenDef } from "@/lib/screens";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import styles from "./screens/screen.module.css";

type Props = {
  screen: ScreenDef;
  badge?: string;
};

export function ScreenPlaceholder({ screen, badge = "Próximamente" }: Props) {
  return (
    <article className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${screen.code} · ${badge}`}
          title={screen.title}
          question={screen.purpose}
        />
      </div>
      <p className={styles.dashNote}>
        Pantalla aún no implementada en profundidad. El dominio de KPIs/alertas
        ya existe; esta vista fija el mapa de navegación del Paso 8. Enlace
        disponible desde el tablero ejecutivo.
      </p>
    </article>
  );
}
