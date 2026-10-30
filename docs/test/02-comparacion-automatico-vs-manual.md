# Paso 11 · Entregable 2 — Automático vs manual y umbrales de alerta

## Checklist

- [x] Correr CP-01..CP-06 adaptados (LF verde, LF rojo 2 semanas, fuente sin cargar, dato atípico, pico/capacidad, caída/oportunidad)
- [x] Matriz de casos con resultado obtenido vs esperado
- [x] Bitácora de defectos con corrección aplicada
- [x] Re-ejecutar hasta cero diferencias **de fórmula** (política CP-02 queda condicionada)

---

## 1. Comparación K1–K5 (automático = manual)

Valores leídos del dominio en la misma corrida (28 oct 2026).

| KPI | Manual (crudo) | Automático (dominio) | Δ | Semáforo manual | Semáforo auto | Veredicto |
| --- | ---: | ---: | ---: | --- | --- | --- |
| **K1 nacional** (S10) | 0,8699670439891102 | 0,8699670439891102 | 0 | green | green | **OK** |
| **K1 internacional** (S10 PTY) | 0,7425531914893617 | 0,7425531914893617 | 0 | green | green | **OK** |
| **K2** | 4/5 = 0,8 | 0,8 · `quarterly_below_90` | 0 | red | red | **OK** |
| **K3** | 1452689/1700000 = 0,8545229411764705 | 0,8545229411764705 | 0 | yellow | yellow | **OK** |
| **K4** | 920/11500 = 0,08 | 0,08 | 0 | red | red | **OK** |
| **K5** | 149/170 = 0,8764705882352941 | 0,8764705882352941 | 0 | red | red | **OK** |

**Criterio «cero diferencias» de cálculo:** cumplido para K1–K5 en el corte S10 / as-of 30 nov.

Comprobaciones de higiene:

- K1 **no** promedia porcentajes por vuelo (agrega pax y sillas primero).
- Denominador 0 → `no_data` (cubierto por tests de dominio; no aplica en S10).
- H1 2026 no altera K3.

---

## 2. Matriz CP-01..CP-06 (obtenido vs esperado)

| ID | Esperado (adaptado) | Obtenido en prototipo | ¿Umbral exacto? | Estado |
| --- | --- | --- | --- | --- |
| **CP-01** LF verde | K1 ≥ 70 % en ventana verde; sin racha roja para esa entidad | Nacional S10 **87,00 %** green; PTY S01 **87,33 %** green; tiles K1 green en ambos alcances en S10 | Sí (verde ≥ 0,70) | **PASS** |
| **CP-02** LF rojo 2 semanas | Tras **2** semanas < 65 %, alerta `K1_RED_STREAK` + PG-02 | Nacional: `MTR-BAQ\|Satena\|E145` 63 % (2 nov) + 64 % (9 nov) → alerta periodo `2026-11-02`–`2026-11-15`. Internacional: `MTR-PTY\|Satena\|E145` y `MTR-PTY\|Copa\|B738` con rachas ≥ 2 | Sí respecto a política **provisional N=2** | **CONDITIONAL** — ADR-003 / conflicto con Pasos 5–8 (N=3). No marcar aceptación final hasta tutor |
| **CP-03** Fuente sin cargar | K5 rojo/parcial + alerta TI | K5 **87,65 %** red; alerta `SOURCE_NOT_LOADED` · entidad `MANIFEST-CMP` · owner TI · PG-01 | Sí (cargada=false y 0/20) | **PASS** |
| **CP-04** Dato atípico | Excluido del agregado + log | ETL `LOAD-2026-11-30-ARINC`: accepted 99, rejected 1, reason RC-03; ARINC aporta 99/100 a K5 | Sí (rechazo RC-03) | **PASS** (mapeado a calidad/ETL; ya no existe KPI turnaround) |
| **CP-05** Pico / presión de capacidad | K3 en amarillo o rojo según umbral | K3 **85,45 %** yellow (80–90 %) | Sí (yellowMin implícito ≥ 0,80 y < 0,90) | **PASS** (adaptado a K3; sin serie de espera migratoria en fixtures) |
| **CP-06** Caída / oportunidad | K5 cae por oportunidad; incidente visible | K5 red por manifiestos Copa no cargados; ARINC sin downtime de 45 min explícito | Parcial | **PASS parcial** — oportunidad cubierta; falta incidente ARINC 45 min en datos (gap, no defecto de fórmula) |

### Alertas observadas (catálogo activo)

| Trigger | Entidad | Severidad | Periodo | Owner / política | Alcance |
| --- | --- | --- | --- | --- | --- |
| `K1_RED_STREAK` | `MTR-BAQ\|Satena\|E145` | red | 2026-11-02 → 2026-11-15 | Dirección Comercial / PG-02 | nacional |
| `K1_RED_STREAK` | `MTR-PTY\|Satena\|E145` | red | 2026-11-23 → 2026-12-06 | Dirección Comercial / PG-02 | internacional |
| `K1_RED_STREAK` | `MTR-PTY\|Copa\|B738` | red | ventanas de 2 y 3 semanas desde 2026-11-30 | Dirección Comercial / PG-02 | internacional |
| `SOURCE_NOT_LOADED` | `MANIFEST-CMP` | red | 2026-11-30 | TI / PG-01 | ambos (K5 aeropuerto) |

Umbrales K1 usados: rojo < **0,65**; racha = **2** semanas consecutivas (`alertPolicies.k1RedStreak.redStreakWeeks`).

---

## 3. Bitácora de defectos

| ID | Severidad | Hallazgo | ¿Afecta fórmula? | Corrección aplicada | Re-test |
| --- | --- | --- | --- | --- | --- |
| DEF-00 | — | Ninguna diferencia numérica K1–K5 automático vs manual | No | N/A | OK 28 oct |
| DEF-01 | Política | CP-02: N=2 (código/Paso 11) vs N=3 (Pasos 5/8) | No (política) | **Ninguna en código** (pedido: no mover código). Documentado ADR-003; CP-02 = CONDITIONAL | Pendiente tutor |
| DEF-02 | Cobertura datos | CP-06 sin evento «ARINC down 45 min» | No | Gap documentado; se valida oportunidad vía Copa/RC-05 | PASS parcial |
| DEF-03 | Alcance histórico | Notion «12 semanas» vs 10 semanas en fixtures | No | Documentado en entregable 1; sim-1.0 aún placeholder | Aceptado para este ciclo |

**Re-ejecución:** tras confirmar Δ=0 en K1–K5, no se requirieron parches de fórmula. Defectos abiertos son de **política/cobertura de fixture**, no de cálculo.

---

## 4. ¿Cómo reproducir? (sin tocar código)

```bash
git checkout feat/dss-red-nacional
pnpm test          # incluye kpis, alerts, dashboard, ops-scope
pnpm typecheck
# Tablero: /p1 (nacional por defecto) y /p1?op=internacional
```

Verificación manual rápida S10:

1. Nacional: Σ pax 12143 / Σ sillas 13958 → 86,9967 % → verde.
2. K3: 1452689 / 1700000 → 85,4523 % → amarillo.
3. K5: 149 / 170 → 87,6471 % → rojo + alerta Manifiestos Copa.

---

## 5. Siguiente entregable

[03-acta-duenos-del-dato.md](./03-acta-duenos-del-dato.md) — firma simulada por dueño del dato / fuente.
