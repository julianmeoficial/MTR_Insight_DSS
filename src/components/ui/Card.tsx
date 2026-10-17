import { cn } from "@/lib/cn";
import styles from "./Card.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

export function Card({ children, className, as: Tag = "div" }: Props) {
  return <Tag className={cn(styles.card, className)}>{children}</Tag>;
}
