"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";
import { WayfindingTag } from "@/components/ui/WayfindingTag";
import { Tooltip } from "@/components/ui/Tooltip";
import styles from "./DemoBanner.module.css";

export function DemoBanner() {
  const { dict } = usePreferences();
  return (
    <div className={styles.banner} role="status">
      <Tooltip label={dict.demo.tooltip}>
        <span className={styles.tagWrap}>
          <WayfindingTag variant="location">{dict.demo.tag}</WayfindingTag>
        </span>
      </Tooltip>
      <span className={styles.copy}>{dict.demo.banner}</span>
    </div>
  );
}
