# 1 — Dataset documentado y cálculo manual K1–K5

> Este documento es el **primer paso** del ciclo de validación: describir el dataset y calcular a mano cada KPI estratégico. No modifica código.

## Checklist

- [x] Describir archivos, columnas y supuestos del dataset (ventana demo del prototipo)
- [x] Hoja de cálculo (tablas) con el cálculo manual de K1–K5
- [x] Adaptar CP-01..CP-06 de Notion a K1–K5

---

## ⁄`1. Dataset del prototipo

### 1.1 Inventario de archivos

| Archivo | Hecho / catálogo | KPI / uso | Estado |
| --- | --- | --- | --- |
| `flights.json` | HECHO_VUELO | K1, alertas PG-02 | `synthetic-demo` |
| `requirements.json` | HECHO_REQUISITO | K2 | simulado + evidencias demo |
| `capacity.json` | HECHO_CAPACIDAD | K3 | ancla 2025 (1.452.689 / 1.700.000) |
| `demand.json` | HECHO_DEMANDA | K4 | corte demo oct–nov 2026 |
| `quality.json` | HECHO_CALIDAD_DATO | K5, alerta PG-01 | carga del 30 nov 2026 |
| `etl-log.json` | bitácora ETL | RC-03 / RC-05 | trazabilidad de carga |
| `routes.json` | DIM_RUTA | alcance nacional/internacional | Airplan `/rutas` |
| `airlines.json` | DIM_AEROLINEA | operadores | Airplan `/aerolineas` |
| `cargo.json` | DIM_INFRAESTRUCTURA (atributos) | ficha P4, no KPI | Airplan `/terminal-de-carga` |
| `semester-h1-2026.json` | agregado publicado | cinta P1; **no** es K3 | noticia 9 jul 2026 |
| `infrastructure.json` | pista / terminal | K3 ficha, RC-08 | metar-taf 2.297 m |
| `situation.json` | contexto rutas/aeródromo | P4 / validador | mixto verificado + simulado |
| `meta.json` | proveniencia del bundle | pie de tablero | `verificationStatus: simulated` |

**Nota sobre «12 semanas» (Paso 11):** el texto de Notion pide *«12 semanas de operación»*. El bundle activo del tablero contiene **10 semanas demo** (`2026-10-26` → `2026-12-28`, etiquetas S01–S10). El paquete `data/fixtures/sim-1.0/` sigue como *placeholder* en `main` (sin JSON de hechos). La validación de este ciclo se hace sobre el **dataset cargado por el prototipo**, no sobre un sim-1.0 aún ausente.

### 1.2 Columnas de `flights.json` (HECHO_VUELO)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `route` | texto | `MTR-BAQ`, `MTR-BOG`, `MTR-EOH`, `MTR-MDE`, `MTR-PTY` |
| `operator` | texto | Avianca, Clic, JetSMART, LATAM, Satena, Copa |
| `aircraftType` | texto | `E145`, `B738`, `A320`, `A20N`, `AT72` |
| `weekStart` / `weekEnd` | fecha ISO | grano semanal demo |
| `week` | entero | 1…10 |
| `fecha` | fecha ISO | día representativo del vuelo/agregado |
| `passengersBoarded` | entero | embarcados (sin tripulación) |
| `seatsOffered` | entero | sillas configuradas del equipo |

**Conteo:** 130 filas (40 PTY + 90 nacionales).

### 1.3 Supuestos explícitos

1. **K1 nacional semanal es** `synthetic-demo`**:** calibrado a ritmo H1 y frecuencias publicadas; **no** es manifiesto real.
2. **Copa** en PTY está **anunciada** (dic 2026); filas demo sirven para umbrales/alertas.
3. **H1 2026** (801.353 pax / 10.502 ops) es agregado **verificado** de Airplan; **no** se anualiza ni entra a K3.
4. **Pista:** 2.297 m adoptados; no se usa FlightRadar24 `09L/…` (RC-08).
5. Umbrales: `src/config/thresholds.ts` v1.0.0. Racha K1: **2 semanas** provisional (`alert-policies.ts`; conflicto con Pasos 5/8 = 3). Ver [decisions.md](../decisions.md) ADR-003.

### 1.4 Fuentes externas de ancla (no inventadas)

| Dato | Fuente | URL / origen |
| --- | --- | --- |
| Red de rutas / aerolíneas / carga | Airplan sitio oficial | https://www.aeropuertomonteria.co/rutas · `/aerolineas` · `/terminal-de-carga` |
| H1 2026 | Noticia Airplan 9 jul 2026 | https://www.aeropuertomonteria.co/noticias/a-junio-asi-avanzamos-mtr |
| Capacidad / tráfico 2025 | ancla Paso 5 (1,7 M; 85,5 %) | Notion Paso 5 |
| Pista 2.297 m | metar-taf / comité | ficha `infrastructure.json` |
| Vuelos demo K1 | fixture sintético del repo | `data/fixtures/dashboard/flights.json` |

---

## 2. Hoja de cálculo manual — K1 a K5

Convención: ratios **crudos** (sin redondear para el semáforo). Presentación en % a 1–2 decimales.

### 2.1 K1 — Load factor = Σ pax / Σ sillas

**Semana de corte del tablero (última demo):** `weekStart = 2026-12-28` (S10).

#### Alcance nacional (BAQ+BOG+EOH+MDE)

| Ruta | Pax | Sillas | LF crudo | LF % | Semáforo |
| --- | ---: | ---: | ---: | ---: | --- |
| MTR-BAQ | 365 | 472 | 0,77330508 | 77,33 % | verde |
| MTR-BOG | 7.150 | 8.004 | 0,89330335 | 89,33 % | verde |
| MTR-EOH | 745 | 952 | 0,78256303 | 78,26 % | verde |
| MTR-MDE | 3.883 | 4.530 | 0,85717439 | 85,72 % | verde |
| **Σ nacional** | **12.143** | **13.958** | **0,86996704** | **87,00 %** | **verde (≥ 70 %)** |

Cálculo: `12143 ÷ 13958 = 0,8699670439891102`.

#### Alcance internacional (MTR-PTY)

| Agregado S10 | Pax | Sillas | LF crudo | LF % | Semáforo |
| --- | ---: | ---: | ---: | ---: | --- |
| MTR-PTY (Satena+Copa) | 349 | 470 | 0,74255319 | 74,26 % | verde |

#### Serie semanal (referencia manual)

| Semana | Nacional LF % | Pax/Sillas | PTY LF % | Pax/Sillas |
| --- | ---: | --- | ---: | --- |
| 2026-10-26 | 75,86 | 9769/12878 | 87,33 | 131/150 |
| 2026-11-02 | 74,18 | 9553/12878 | 84,00 | 126/150 |
| 2026-11-09 | 73,69 | 9490/12878 | 76,00 | 114/150 |
| 2026-11-16 | 75,10 | 9671/12878 | 68,67 | 103/150 |
| 2026-11-23 | 75,80 | 9762/12878 | 62,00 | 93/150 |
| 2026-11-30 | 80,16 | 10323/12878 | 59,79 | 281/470 |
| 2026-12-07 | 82,23 | 10590/12878 | 63,19 | 297/470 |
| 2026-12-14 | 86,12 | 12021/13958 | 64,89 | 305/470 |
| 2026-12-21 | 90,06 | 12571/13958 | 69,57 | 327/470 |
| 2026-12-28 | 87,00 | 12143/13958 | 74,26 | 349/470 |

### 2.2 K2 — Cumplimiento = satisfechos con evidencia / aplicables

`asOfDate = 2026-11-30`. Satisfecho solo si hay `evidenceId` + `approvalDate ≤ asOf`.

| ID | Crítico | Due | Evidencia | ¿Satisfecho? | Nota |
| --- | --- | --- | --- | --- | --- |
| REQ-MIG-4003 | sí | 2026-12-31 | EV-MIG-1 | sí | |
| REQ-DIAN-1639 | sí | 2026-12-31 | EV-DIAN-1 | sí | |
| REQ-ICA-DOC | sí | 2026-12-15 | EV-ICA-1 | sí | |
| REQ-COPA-PERM | sí | 2026-12-01 | EV-COPA-PRESS | sí | |
| REQ-BODY-SCAN | no | 2026-11-20 | — | **no** | vencido no crítico |

- Numerador / denominador: **4 / 5 = 0,8**
- Críticos vencidos: ninguno → no override `critical_overdue`
- Cumplimiento trimestral **0,8 < 0,90** → **rojo** (`quarterly_below_90`)
- Además hay hito no crítico vencido (amarillo habría sido el siguiente escalón si el ratio fuera ≥ 90 %)

### 2.3 K3 — Utilización = pax 12 meses / capacidad declarada

| Numerador | Denominador | Ratio | % | Semáforo |
| ---: | ---: | ---: | ---: | --- |
| 1.452.689 | 1.700.000 | 0,85452294 | 85,45 % | **amarillo** (80 % ≤ x < 90 %) |

H1 2026 **no** entra aquí: `801.353 × 2 ≠` rolling 12 meses.

### 2.4 K4 — Captura internacional = salidas intl MTR / viajeros zona

| Salidas intl MTR | Viajeros zona | Ratio | % | Semáforo |
| ---: | ---: | ---: | ---: | --- |
| 920 | 11.500 | 0,08 | 8,0 % | **rojo** (< 10 %) |

### 2.5 K5 — Integridad = registros críticos a tiempo y validados / esperados

| Fuente | Esperados | Validados a tiempo | Cargada |
| --- | ---: | ---: | --- |
| ARINC | 100 | 99 | sí |
| Manifiestos Satena | 50 | 50 | sí |
| Manifiestos Copa | 20 | 0 | **no** |
| **Total** | **170** | **149** | |

`149 ÷ 170 = 0,87647059` → **87,65 %** → **rojo** (< 95 %). Sin conflicto técnico abierto en el fixture.

---

## 3. Adaptación CP-01..CP-06 → K1–K5

Notion listaba casos del esquema piloto (K1, K3, K4, K6, K10, K14, K16, K22). Tras la realineación del 15 oct 2026 se prueban **solo K1–K5**. Mapeo:

| ID | Caso Notion (original) | Adaptación a K1–K5 | Entrada en el dataset actual | Resultado esperado |
| --- | --- | --- | --- | --- |
| **CP-01** | LF en verde (3 freq · 78 %) | **K1** verde, sin `K1_RED_STREAK` en esa entidad/semana | S10 nacional 87,00 %; PTY S01 87,33 % | Semáforo verde; sin alerta de racha para esas ventanas verdes |
| **CP-02** | LF rojo **2** semanas · 61 % | **K1** rojo < 65 % en ≥ 2 semanas seguidas → alerta PG-02 | `MTR-BAQ\|Satena\|E145` 63 % + 64 % (2–9 nov); Copa B738 PTY < 65 % en 30 nov–14 dic | Alerta `K1_RED_STREAK` · **conflicto abierto:** Pasos 5/8 piden 3 semanas; el código usa 2 (ADR-003). No firmar aceptación definitiva hasta decisión del tutor |
| **CP-03** | Fuente sin cargar (Biomig) | **K5** parcial/rojo + alerta TI (**PG-01**). En el prototipo el hueco crítico es **Manifiestos Copa** | `MANIFEST-CMP` `loaded: false`, 0/20 | K5 rojo; alerta `SOURCE_NOT_LOADED` entidad `MANIFEST-CMP` |
| **CP-04** | Dato atípico (turnaround 480 min · ex-K6) | **K5 / RC-03**: valor fuera de rango **excluido** y registrado en ETL (ya no hay KPI de turnaround en el tablero) | `etl-log` LOAD-ARINC: 1 fila rechazada «RC-03 rango fuera de umbral» | Fila rechazada; K5 no cuenta ese registro como validado (ARINC 99/100) |
| **CP-05** | Pico migratorio (ex-K10) | **K3** utilización terminal / capacidad (hora pico queda como variable de control; el corte demo usa rolling 12 m) | K3 = 85,45 % (amarillo) | Semáforo amarillo; sugiere planear ampliación (umbrales 80/90 %), sin inventar un KPI migratorio nuevo |
| **CP-06** | Caída ARINC 45 min (ex-K22) | **K5** oportunidad del dato + bitácora | No hay evento «45 min down» literal; se valida con carga incompleta / RC-05 Copa y ARINC 99/100 + motivo ETL | K5 rojo por oportunidad; log de carga visible. Gap documentado: falta un incidente ARINC de 45 min explícito en fixtures |

---

## 4. Referencias

- Fórmulas: [docs/kpis.md](../kpis.md), `.cursorrules`
- Decisiones: [docs/decisions.md](../decisions.md)
- Siguiente entregable: [02-comparacion-automatico-vs-manual.md](./02-comparacion-automatico-vs-manual.md)
