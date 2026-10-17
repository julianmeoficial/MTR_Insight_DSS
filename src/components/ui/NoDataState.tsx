import { cn } from "@/lib/cn";
import panel from "./StatePanel.module.css";

type Props = {
  title: string;
  body: string;
  className?: string;
};

export function NoDataState({ title, body, className }: Props) {
  return (
    <div className={cn(panel.panel, className)}>
      <p className={panel.title}>{title}</p>
      <p className={panel.body}>{body}</p>
    </div>
  );
}
