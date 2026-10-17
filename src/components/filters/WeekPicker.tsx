"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./filters.module.css";

type Week = { weekStart: string; label: string };

type Props = {
  weeks: Week[];
  selected?: string;
};

export function WeekPicker({ weeks, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = selected ?? weeks[weeks.length - 1]?.weekStart ?? "";

  return (
    <label className={styles.label}>
      Semana (demo)
      <select
        className={styles.select}
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("semana", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {weeks.map((w) => (
          <option key={w.weekStart} value={w.weekStart}>
            {w.label} · {w.weekStart}
          </option>
        ))}
      </select>
    </label>
  );
}
