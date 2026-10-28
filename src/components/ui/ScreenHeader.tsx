import { WayfindingTag } from "@/components/ui/WayfindingTag";
import styles from "./ScreenHeader.module.css";

type Props = {
  eyebrow: string;
  title: string;
  question: string;
  children?: React.ReactNode;
};

export function ScreenHeader({ eyebrow, title, question, children }: Props) {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>
        <WayfindingTag variant="location">SKMR</WayfindingTag>
        <span>{eyebrow}</span>
      </p>
      <div className={styles.row}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.question}>{question}</p>
        </div>
        {children ? <div className={styles.actions}>{children}</div> : null}
      </div>
    </header>
  );
}
