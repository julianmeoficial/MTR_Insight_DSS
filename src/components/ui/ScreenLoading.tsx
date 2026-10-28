import { PapiLoader } from "@/components/ui/PapiLoader";
import styles from "./ScreenLoading.module.css";

/** Route-level loading: PAPI glyph (DESIGN.md §8.3), never a spinner. */
export function ScreenLoading({ label }: { label: string }) {
  return (
    <main className={styles.root}>
      <PapiLoader label={label} />
      <p className={styles.label}>{label}</p>
    </main>
  );
}
