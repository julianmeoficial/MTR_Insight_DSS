"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TrafficLight } from "@/domain/types";
import { GlobalSemaphore } from "@/components/shell/GlobalSemaphore";
import { useDemoSession } from "@/components/providers/DemoSessionProvider";
import { ThemeLocaleToggles } from "@/components/ui/ThemeLocaleToggles";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { RoleId } from "@/config/access-matrix";
import styles from "./TopBar.module.css";

type Props = {
  role: RoleId;
  globalStatus: TrafficLight;
  lastValidated: string;
  asOfDate: string;
  breadcrumb?: string;
};

export function TopBar({
  role,
  globalStatus,
  lastValidated,
  asOfDate,
  breadcrumb,
}: Props) {
  const { dict } = usePreferences();
  const { clearRole } = useDemoSession();
  const router = useRouter();

  function signOut() {
    clearRole();
    router.push("/login");
  }

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <Link href="/" className={styles.wordmark}>
          {dict.brand}
        </Link>
        {breadcrumb ? <span className={styles.crumb}>{breadcrumb}</span> : null}
      </div>
      <div className={styles.meta}>
        <div className={styles.session} aria-label={dict.access.sessionLabel}>
            <span className={styles.roleName}>{dict.access.roles[role]}</span>
            <Link href="/login" className={styles.sessionLink}>
              {dict.access.switchAccount}
            </Link>
            <button type="button" className={styles.sessionLink} onClick={signOut}>
              {dict.access.signOut}
            </button>
          </div>
        <ThemeLocaleToggles />
        <p className={`num ${styles.asOf}`}>
          {dict.shell.asOf} {asOfDate} · America/Bogota
        </p>
        <Tooltip label={dict.demo.tooltip}>
          <span>
            <WayfindingTag variant="location">{dict.demo.tag}</WayfindingTag>
          </span>
        </Tooltip>
        <GlobalSemaphore status={globalStatus} lastValidated={lastValidated} />
      </div>
    </header>
  );
}
