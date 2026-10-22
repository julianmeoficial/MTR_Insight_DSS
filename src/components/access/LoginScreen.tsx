"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_IDS, type RoleId } from "@/config/access-matrix";
import { homeForRole } from "@/domain/access";
import { useDemoSession } from "@/components/providers/DemoSessionProvider";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Button } from "@/components/ui/Button";
import { ThemeLocaleToggles } from "@/components/ui/ThemeLocaleToggles";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  const { dict } = usePreferences();
  const { role, setRole } = useDemoSession();
  const router = useRouter();

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
          <h1 className={styles.title}>{dict.access.loginTitle}</h1>
          <p className={styles.lead}>{dict.access.loginLead}</p>
        </div>
        <ul className={styles.list} aria-label={dict.access.accountListLabel}>
          {ROLE_IDS.map((id) => {
            const current = role === id;
            return (
              <li key={id}>
                <Button
                  variant={current ? "primary" : "secondary"}
                  className={styles.account}
                  aria-pressed={current}
                  onClick={() => choose(id)}
                >
                  <span className={styles.accountLabel}>
                    {dict.access.roles[id]}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
