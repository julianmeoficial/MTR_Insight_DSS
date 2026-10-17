import { cn } from "@/lib/cn";
import panel from "./StatePanel.module.css";
import styles from "./StaleState.module.css";

type Props = {
  title: string;
  body: string;
  className?: string;
};

export function StaleState({ title, body, className }: Props) {
  return (
    <div
      className={cn(panel.panel, styles.stale, className)}
      role="status"
    >
      <p className={panel.title}>{title}</p>
      <p className={panel.body}>{body}</p>
    </div>
  );
}
