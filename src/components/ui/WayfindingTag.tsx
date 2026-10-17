import { cn } from "@/lib/cn";
import styles from "./WayfindingTag.module.css";

type Variant = "location" | "direction";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

export function WayfindingTag({
  children,
  variant = "location",
  className,
}: Props) {
  return (
    <span className={cn(styles.tag, className)} data-variant={variant}>
      {children}
    </span>
  );
}
