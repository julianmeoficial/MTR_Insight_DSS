import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import panel from "./StatePanel.module.css";
import styles from "./ErrorState.module.css";

type Props = {
  title: string;
  body: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
  className,
}: Props) {
  return (
    <div className={cn(panel.panel, styles.error, className)} role="alert">
      <p className={panel.title}>{title}</p>
      <p className={panel.body}>{body}</p>
      {retryLabel && onRetry ? (
        <div className={panel.actions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
