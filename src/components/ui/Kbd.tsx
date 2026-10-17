import { cn } from "@/lib/cn";
import styles from "./Kbd.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Kbd({ children, className }: Props) {
  return (
    <kbd className={cn(styles.kbd, className)}>
      {children}
    </kbd>
  );
}
