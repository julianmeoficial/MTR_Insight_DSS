export type ScreenDef = {
  href: string;
  code: string;
  title: string;
  purpose: string;
  kind: "shell" | "placeholder" | "alerts";
};

/** Paso 8 navigation map — Spanish UI labels. */
export const SCREENS: readonly ScreenDef[] = [
  {
    href: "/p1",
    code: "P1",
    title: "Tablero ejecutivo",
    purpose: "Resumen de K1–K5, frescura del dato y alertas priorizadas.",
    kind: "shell",
  },
  {
    href: "/p2",
    code: "P2",
    title: "Rutas y ocupación",
    purpose: "Load factor por ruta, operador y aeronave frente a umbrales.",
    kind: "shell",
  },
  {
    href: "/p3",
    code: "P3",
    title: "Cumplimiento y regulación",
    purpose:
      "Matriz de requisitos por autoridad (Aerocivil, Migración, DIAN, ICA, AVSEC, ANI), evidencia y vencimientos (K2).",
    kind: "placeholder",
  },
  {
    href: "/p4",
    code: "P4",
    title: "Infraestructura y capacidad",
    purpose:
      "Utilización de terminal, hora pico, ficha técnica verificada y obras del Plan Maestro (K3).",
    kind: "placeholder",
  },
  {
    href: "/p5",
    code: "P5",
    title: "Desarrollo de rutas y demanda",
    purpose:
      "Captura de demanda internacional regional, competidores y evidencia para nuevas rutas (K4).",
    kind: "placeholder",
  },
  {
    href: "/p6",
    code: "P6",
    title: "Planeación 2045 (DSS)",
    purpose:
      "Equilibrio aeroportuario por aeronave, escenarios 2,5 % / 3,9 % / 5,5 % y disparadores 80/90 % (R16).",
    kind: "shell",
  },
  {
    href: "/p7",
    code: "P7",
    title: "Calidad del dato y TI",
    purpose:
      "Cargas a tiempo, reglas de calidad, conflictos abiertos y disponibilidad de fuentes (K5).",
    kind: "placeholder",
  },
  {
    href: "/alertas",
    code: "Alertas",
    title: "Centro de alertas",
    purpose:
      "Eventos activos del motor de dominio (racha K1 en rojo, fuentes sin cargar, etc.).",
    kind: "alerts",
  },
] as const;

export function getScreen(code: string): ScreenDef | undefined {
  return SCREENS.find((s) => s.code === code);
}
