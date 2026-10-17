import styles from "./ProvenanceLine.module.css";

type Props = {
  source: string;
  datasetVersion: string;
  verificationStatus: string;
  lastValidated: string;
};

export function ProvenanceLine({
  source,
  datasetVersion,
  verificationStatus,
  lastValidated,
}: Props) {
  return (
    <p className={styles.line}>
      <span className="num">{source}</span>
      {" · "}
      <span className="num">{datasetVersion}</span>
      {" · "}
      {verificationStatus}
      {" · Validado "}
      <span className="num">{lastValidated}</span>
    </p>
  );
}
