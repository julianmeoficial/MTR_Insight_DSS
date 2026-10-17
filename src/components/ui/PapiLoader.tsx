import { cn } from "@/lib/cn";
import styles from "./PapiLoader.module.css";

type Props = {
  label?: string;
  className?: string;
};

export function PapiLoader({ label, className }: Props) {
  return (
    <div
      className={cn(styles.wrap, className)}
      role="status"
      aria-label={label}
    >
      <span className={styles.light} data-index="0" aria-hidden />
      <span className={styles.light} data-index="1" aria-hidden />
      <span className={styles.light} data-index="2" aria-hidden />
      <span className={styles.light} data-index="3" aria-hidden />
    </div>
  );
}
