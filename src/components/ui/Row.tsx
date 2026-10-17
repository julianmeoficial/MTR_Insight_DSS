import { cn } from "@/lib/cn";
import styles from "./Row.module.css";

type Props = {
  title: React.ReactNode;
  status?: React.ReactNode;
  code?: React.ReactNode;
  meta?: React.ReactNode;
  owner?: React.ReactNode;
  time?: React.ReactNode;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
};

export function Row({
  title,
  status,
  code,
  meta,
  owner,
  time,
  selected = false,
  className,
  onClick,
}: Props) {
  const classNameMerged = cn(styles.row, className);
  const selectedAttr = selected ? "true" : undefined;

  if (onClick) {
    return (
      <button
        type="button"
        className={classNameMerged}
        data-selected={selectedAttr}
        onClick={onClick}
      >
        {status ? <span className={styles.status}>{status}</span> : null}
        <span className={styles.title}>{title}</span>
        {code ? <span className={styles.code}>{code}</span> : null}
        {meta ? <span className={styles.meta}>{meta}</span> : null}
        {owner ? <span className={styles.owner}>{owner}</span> : null}
        {time ? <span className={styles.time}>{time}</span> : null}
      </button>
    );
  }

  return (
    <div className={classNameMerged} data-selected={selectedAttr}>
      {status ? <span className={styles.status}>{status}</span> : null}
      <span className={styles.title}>{title}</span>
      {code ? <span className={styles.code}>{code}</span> : null}
      {meta ? <span className={styles.meta}>{meta}</span> : null}
      {owner ? <span className={styles.owner}>{owner}</span> : null}
      {time ? <span className={styles.time}>{time}</span> : null}
    </div>
  );
}
