import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import panel from "./StatePanel.module.css";
import styles from "./EmptyState.module.css";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  shortcutHint?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  shortcutHint,
  className,
}: Props) {
  return (
    <div className={cn(panel.panel, styles.empty, className)}>
      <p className={panel.title}>{title}</p>
      <p className={panel.body}>{body}</p>
      {(actionLabel && onAction) || shortcutHint ? (
        <div className={panel.actions}>
          {actionLabel && onAction ? (
            <Button variant="secondary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {shortcutHint ? (
            <span className={panel.hint}>{shortcutHint}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
