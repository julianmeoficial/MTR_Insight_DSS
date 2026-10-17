import { cn } from "@/lib/cn";
import styles from "./Skeleton.module.css";

type Props = {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "pill";
};

export function Skeleton({
  className,
  width,
  height,
  rounded = "md",
}: Props) {
  return (
    <span
      className={cn(styles.bone, className)}
      data-rounded={rounded}
      style={{ width, height }}
      aria-hidden
    />
  );
}
