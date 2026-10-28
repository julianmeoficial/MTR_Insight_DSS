"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Plane,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ACCESS_MATRIX, type RoleId } from "@/config/access-matrix";
import { allowedNavHrefs, homeForRole } from "@/domain/access";
import { useDemoSession } from "@/components/providers/DemoSessionProvider";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { ThemeLocaleToggles } from "@/components/ui/ThemeLocaleToggles";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fillTemplate } from "@/i18n/dictionaries";
import styles from "./LoginScreen.module.css";

type GroupId = "management" | "areas" | "airlines" | "oversight";

/** Demo accounts grouped by how people think about access, not by code. */
const GROUPS: { id: GroupId; icon: LucideIcon; roles: RoleId[] }[] = [
  { id: "management", icon: Building2, roles: ["gerencia_general", "gerencia_mtr", "junta"] },
  { id: "areas", icon: Users, roles: ["comercial", "juridica", "infraestructura", "coordinacion"] },
  { id: "airlines", icon: Plane, roles: ["satena", "copa"] },
  { id: "oversight", icon: ShieldCheck, roles: ["ani", "ti"] },
];

const HREF_LABEL = {
  "/p1": "board",
  "/p2": "routes",
  "/p3": "compliance",
  "/p4": "infrastructure",
  "/p5": "demand",
  "/p6": "planning",
  "/p7": "quality",
  "/alertas": "alerts",
  "/situacion": "situation",
  "/escenarios": "scenarios",
  "/validador": "validator",
  "/admin": "admin",
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export function LoginScreen() {
  const { dict } = usePreferences();
  const t = dict.access;
  const { role, setRole } = useDemoSession();
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const initialGroup =
    GROUPS.find((g) => role && g.roles.includes(role))?.id ?? "management";
  const [group, setGroup] = useState<GroupId>(initialGroup);
  const active = GROUPS.find((g) => g.id === group)!;

  function choose(next: RoleId) {
    setRole(next);
    router.push(homeForRole(next));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>
          {dict.brand}
        </Link>
        <div className={styles.headerActions}>
          <ThemeLocaleToggles />
          <WayfindingTag variant="location">{dict.demo.tag}</WayfindingTag>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.tags}>
            <WayfindingTag variant="location">MTR · SKMR</WayfindingTag>
            <WayfindingTag variant="direction">{t.loginTitle} →</WayfindingTag>
          </p>
          <h1 className={styles.title}>{t.loginTitle}</h1>
          <p className={styles.lead}>{t.loginLead}</p>
        </div>

        <div className={styles.picker}>
          <nav className={styles.groups} aria-label={t.step1}>
            <p className={styles.stepLabel}>
              <span className={styles.stepNum}>1</span>
              {t.step1}
            </p>
            <ul className={styles.groupList} role="tablist" aria-label={t.step1}>
              {GROUPS.map((g) => {
                const Icon = g.icon;
                const selected = g.id === group;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={styles.group}
                      onClick={() => setGroup(g.id)}
                    >
                      {selected ? (
                        <motion.span
                          layoutId={reduced ? undefined : "login-group"}
                          className={styles.groupActive}
                          transition={{ duration: 0.24, ease: EASE }}
                          aria-hidden
                        />
                      ) : null}
                      <Icon size={16} strokeWidth={1.5} className={styles.groupIcon} aria-hidden />
                      <span className={styles.groupText}>
                        <span className={styles.groupName}>{t.groups[g.id]}</span>
                        <span className={styles.groupHint}>{t.groupHint[g.id]}</span>
                      </span>
                      <span className={styles.groupCount}>{g.roles.length}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className={styles.accounts} aria-label={t.step2}>
            <p className={styles.stepLabel}>
              <span className={styles.stepNum}>2</span>
              {t.step2}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.ul
                key={group}
                className={styles.accountList}
                aria-label={t.accountListLabel}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {active.roles.map((id) => {
                  const access = ACCESS_MATRIX[id];
                  const current = role === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={styles.account}
                        data-current={current ? "true" : undefined}
                        onClick={() => choose(id)}
                      >
                        <span className={styles.accountHead}>
                          <span className={styles.accountName}>{t.roles[id]}</span>
                          {current ? <span className={styles.currentTag}>{t.current}</span> : null}
                        </span>
                        <span className={styles.accountInfo}>{t.roleInfo[id]}</span>
                        <span className={styles.chips}>
                          {allowedNavHrefs(id).map((href) =>
                            href in HREF_LABEL ? (
                              <span key={href} className={styles.chip}>
                                {dict.nav[HREF_LABEL[href as keyof typeof HREF_LABEL]]}
                              </span>
                            ) : null,
                          )}
                        </span>
                        <span className={styles.accountMeta}>
                          <span>{access.canExport ? t.exports : t.noExport}</span>
                          {access.operatorScope ? (
                            <span>{fillTemplate(t.scopeOwn, { op: access.operatorScope })}</span>
                          ) : null}
                          <span className={styles.enter}>
                            {t.enter}
                            <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </section>
        </div>

        <p className={styles.footnote}>{dict.landing.govNote}</p>
      </main>
    </div>
  );
}
