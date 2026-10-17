"use client";

import Link from "next/link";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import styles from "./UnauthorizedState.module.css";

export function UnauthorizedState() {
  const { dict } = usePreferences();
  return (
    <div className={styles.wrap}>
      <p className={styles.tag}>Vista restringida</p>
      <h1 className={styles.title}>{dict.unauthorizedTitle}</h1>
      <p className={styles.body}>{dict.unauthorizedBody}</p>
      <Link href="/p1" className={styles.cta}>
        {dict.backToBoard}
      </Link>
    </div>
  );
}
