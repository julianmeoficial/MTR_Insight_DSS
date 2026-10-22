# Security notes (base prototype)

MTR Insight’s current build is the academic prototype: fixtures, no database, and no identity provider. Paso 10 (ENG-175, ENG-186, ENG-188) defines the target control model. This document records what the prototype actually does, and the incident-response notes for risk R14. It is not a certification, an ISO 27001 claim, or a conclusion under Ley 1581 de 2012.

## What the demo session is

`/login` lists eleven staging accounts, one per role in the Paso 8 / Paso 10 matrix. Choosing an account writes `mtr-demo-session` (role id only, eight hours, `SameSite=Lax`). SIG routes without a known role redirect to `/login`. Navigation, the command palette, and direct URLs use the same matrix. A denied route shows the restricted state.

This cookie is set from the browser. It is not httpOnly, not signed, and not MFA. Anyone can switch accounts. Treat it as a labeled demo of minimum privilege, not as protection of the data. The fixtures are synthetic.

Real MFA, an identity provider, server-side authorization on every read and export, and PostgreSQL row policies belong to the full SIG. Supabase Auth remains an example, not a selected provider.

## Matrix applied in the prototype

| Role | Screens | Export flag in the UI | Operator scope |
| --- | --- | --- | --- |
| Junta directiva y ASUR | P1, P4, P6 | Allowed, still not implemented | None |
| Gerencia general | P1-P7 | Allowed, still not implemented | None |
| Gerencia MTR | P1-P7 | Allowed, still not implemented | None |
| Dirección comercial | P1, P2, P5 | Allowed, still not implemented | None |
| Dirección jurídica y regulatoria | P1, P3 | Allowed, still not implemented | None |
| Dirección de infraestructura | P4, P6 | Allowed, still not implemented | None |
| Coordinación internacional | P2, P3, P4 | No | None |
| TI | P7 | Technical only, still not implemented | None |
| Satena | P2 | No | Satena flights only |
| Copa | P2 | No | Copa flights only |
| ANI | P3, P4 | No | None |

Auxiliary routes, not listed as screens in Paso 10:

- `/alertas` is available only to roles that can open P1.
- `/escenarios` is available only to roles that can open P6.
- `/decisiones` stays closed for every demo role. The full SIG placeholder is not granted here.

Airline accounts cannot change the P2 operator filter to “Todos” or to the other airline. TI does not see P1-P6 in navigation. Export remains copy only: roles allowed to export still see that CSV export belongs to the full SIG; roles that cannot export see that denial.

## Data handling already in force

- No live links to ARINC, Biomig, DIAN, ICA, Aerocivil, or Airplan.
- Fixtures stay aggregated. Do not add passenger identifiers or biometrics.
- Demo, assumption, and verified reference facts stay labeled apart.

Retention targets from Paso 10 (raw 90 days, warehouse at least 5 years, audit at least 12 months) are documentary targets. This deployment does not configure them.

## R14 response notes

R14 is a cyberattack against a future SIG or against surrounding systems such as ARINC or Biomig. This project has no operational access to those systems. The notes below do not replace Airplan procedures and do not set unapproved notification deadlines.

1. **Detect and record.** Unusual access, privilege changes, unusual exports, fixture or data changes, availability failures, or exposed secrets. Record time, affected system, and a first impact note.
2. **Contain.** Revoke the affected demo session, disable that staging account in the matrix if it must stay offline, and keep evidence out of unauthorized channels.
3. **Assess and escalate.** The designated owner and TI describe scope and integrity, then inform management and data owners. If personal data could be involved, escalate for legal review under the institutional process.
4. **Remove and recover.** Fix the cause, rotate any real secret, restore from a checked copy, and confirm permissions and availability before reopening.
5. **Close and learn.** Record cause, impact, decisions, and preventive actions. Review the role matrix. Do not copy secrets or personal data into the write-up.

## Control checklist (targets, not executed evidence)

| Control | Status in this prototype |
| --- | --- |
| Network segmentation from ARINC / Biomig | Not applicable: no live connection |
| Encryption in transit and at rest | Hosting default only; not claimed as a reviewed control |
| Least privilege with a quarterly review | Demo matrix only; no quarterly review has been run |
| Annual audit aligned with ISO 27001 | Proposed, not performed, not a certification |
| Restore test twice a year | Documentary target for PG-05; not executed |

Before calling the full SIG protected, the Paso 10 checks still need real evidence: unauthenticated denial on the server, MFA, cross-airline requests blocked in queries, TI blocked from commercial and border content, and audit records for exports and admin changes.
