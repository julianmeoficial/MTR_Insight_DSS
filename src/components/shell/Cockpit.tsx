import styles from "./Cockpit.module.css";

type Props = {
  rail: React.ReactNode;
  children: React.ReactNode;
};

export function Cockpit({ rail, children }: Props) {
  return (
    <div className={styles.frame}>
      {rail}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
