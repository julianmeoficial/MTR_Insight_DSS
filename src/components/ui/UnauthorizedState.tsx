"use client";

import Link from "next/link";
import { homeForRole } from "@/domain/access";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { RoleId } from "@/config/access-matrix";
import styles from "./UnauthorizedState.module.css";

type Props = {
  role?: RoleId | null;
};

export function UnauthorizedState({ role = null }: Props) {
  const { dict } = usePreferences();
  const href = role ? homeForRole(role) : "/login";

  return (
    <div className={styles.wrap}>
      <p className={styles.tag}>{dict.access.restrictedTag}</p>
      <h1 className={styles.title}>{dict.unauthorizedTitle}</h1>
      <p className={styles.body}>{dict.unauthorizedBody}</p>
      <Link href={href} className={styles.cta}>
        {dict.access.backToAllowed}
      </Link>
    </div>
  );
}
