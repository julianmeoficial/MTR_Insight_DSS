# Paso 11 · Entregable 3 — Acta de validación por dueño del dato

**Fecha del acta:** 28 oct 2026  
**As-of evaluado:** 2026-11-30 · semana demo K1: 2026-12-28  
**Evidencia de cálculo:** [01-dataset-y-calculo-manual.md](./01-dataset-y-calculo-manual.md) · [02-comparacion-automatico-vs-manual.md](./02-comparacion-automatico-vs-manual.md)

## Checklist

- [x] Plantilla de acta (KPI, dueño, resultado, fecha)
- [x] Una fila por KPI K1–K5 con evidencia enlazada
- [x] Resumen de criterios cumplidos

---

## 1. Plantilla de acta

```
KPI:              K#
Nombre:           …
Dueño del dato:   rol / área
Fuente firmada:   URL o sourceId / nombre de source
Periodo:          …
Resultado crudo:  …
Semáforo:         green | yellow | red | no_data
Δ auto vs manual: 0 | (describir)
Alertas ligadas:  …
Firma simulada:   Nombre · fecha · «Certifico que el valor coincide con el cálculo manual sobre la fuente citada»
Estado:           FIRMADO | CONDICIONAL | BLOQUEADO
```

En el SIG completo la firma sería autenticada (MFA + auditoría). Aquí es **demostración académica** con trazabilidad a fixtures y URLs públicas.

---

## 2. Actas por KPI (K1–K5)

| KPI | Dueño del dato (rol) | Fuente firmada (URL o source) | Periodo | Resultado crudo | Semáforo | Δ auto−manual | Evidencia enlazada | Firma simulada | Estado |
| --- | --- | --- | --- | ---: | --- | ---: | --- | --- | --- |
| **K1** Load factor | Dirección Comercial · Gerencia MTR | Source fixture: `flights.json` (`fuente: synthetic-demo`); catálogo de rutas [aeropuertomonteria.co/rutas](https://www.aeropuertomonteria.co/rutas) | Semana `2026-12-28` (nacional e internacional) | Nac. **0,86996704** · Intl. **0,74255319** | green / green | 0 | Entregables 1–2 §K1; archivo `data/fixtures/dashboard/flights.json` | Julián (equipo TCC) · 28 oct 2026 · Certifico coincidencia suma/suma vs dominio | **FIRMADO** |
| **K2** Cumplimiento | Dirección Jurídica y Regulatoria | Sources: matriz `requirements.json` (REQ-MIG-4003, REQ-DIAN-1639, REQ-ICA-DOC, REQ-COPA-PERM, REQ-BODY-SCAN); anclas normativas citadas en Paso 5 | asOf `2026-11-30` · periodo `2026-10-01`–`2026-12-31` | **0,8** (4/5) · override `quarterly_below_90` | red | 0 | Entregable 1 §2.2; `data/fixtures/dashboard/requirements.json` | Julián (equipo TCC) · 28 oct 2026 · Certifico 4/5 y rojo por < 90 % | **FIRMADO** |
| **K3** Capacidad | Dirección de Infraestructura | Source: `capacity.json` (rolling 12 m / 1.700.000); ancla Paso 5; pista verificada metar-taf en `infrastructure.json` | Rolling 12 meses declarado en fixture | **0,85452294** | yellow | 0 | Entregable 1 §2.3; H1 2026 explícitamente **excluido** ([noticia Airplan](https://www.aeropuertomonteria.co/noticias/a-junio-asi-avanzamos-mtr)) | Julián (equipo TCC) · 28 oct 2026 · Certifico 85,45 % amarillo | **FIRMADO** |
| **K4** Captura intl. | Gerencia General · Comercial | Source: `demand.json` (920 / 11.500); definición MTR–PTY Paso 5 | `2026-10-01`–`2026-11-30` | **0,08** | red | 0 | Entregable 1 §2.4; `data/fixtures/dashboard/demand.json` | Julián (equipo TCC) · 28 oct 2026 · Certifico 8 % rojo | **FIRMADO** |
| **K5** Integridad | TI · Comité de Gestión de la Información | Sources: `quality.json` — `ARINC`, `MANIFEST-SAT`, `MANIFEST-CMP`; bitácora `etl-log.json` | Día `2026-11-30` | **0,87647059** (149/170) | red | 0 | Entregable 1 §2.5; alerta `SOURCE_NOT_LOADED` / `MANIFEST-CMP` | Julián (equipo TCC) · 28 oct 2026 · Certifico 87,65 % rojo y fuente Copa no cargada | **FIRMADO** |

### Notas de firma

- **K1:** el LF nacional es sintético; la firma certifica la **fórmula y la trazabilidad al fixture**, no un manifiesto aerolínea real.
- **CP-02 / PG-02:** la racha de 2 semanas está implementada y observada, pero la **aceptación de política** permanece **CONDICIONAL** (ADR-003) hasta que el tutor unifique N=2 vs N=3. Eso no impide firmar el valor de K1 S10.
- Conflictos técnicos de pista (2.297 vs 2.300) están etiquetados en infraestructura; no abren override K5 en este corte (`unresolvedTechnicalConflict: false` en quality).

---

## 3. Resumen de criterios del Paso 11

| Criterio Notion | Evidencia | ¿Cumple? |
| --- | --- | --- |
| Cero diferencias automático vs manual en K1–K5 | Matriz §1 del entregable 2 | **Sí** |
| Alertas del catálogo en umbral exacto | CP-01..CP-06 §2 del entregable 2 | **Sí** para CP-01, CP-03, CP-04, CP-05; **CP-02 condicional** (política); **CP-06 parcial** (oportunidad sí / incidente 45 min no en fixture) |
| Cada KPI firmado por dueño del dato | Tabla §2 de este acta | **Sí** (firma simulada académica) |
| Set de datos simulados documentado | Entregable 1 | **Sí** (10 semanas demo; sim-1.0 12 semanas aún placeholder) |
| Matriz de casos + bitácora | Entregable 2 | **Sí** |

### Veredicto del ciclo

El tablero del prototipo **reproduce exactamente** el cálculo manual de K1–K5 sobre el dataset cargado, y dispara las alertas de racha K1 y de fuente no cargada en los umbrales configurados. Quedan fuera del «sí absoluto» solo: (1) la decisión de tutor sobre **2 vs 3** semanas en PG-02, y (2) la cobertura de un incidente ARINC de 45 minutos explícito en fixtures.

**No se modificó código de aplicación** en este ciclo de documentación.

---

## 4. Índice de la carpeta `docs/test`

1. [01-dataset-y-calculo-manual.md](./01-dataset-y-calculo-manual.md)
2. [02-comparacion-automatico-vs-manual.md](./02-comparacion-automatico-vs-manual.md)
3. [03-acta-duenos-del-dato.md](./03-acta-duenos-del-dato.md) (este archivo)
