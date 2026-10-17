import { cn } from "@/lib/cn";
import styles from "./charts.module.css";

type Props = {
  seats: number;
  boarded: number;
  label: string;
};

export function SeatUnitChart({ seats, boarded, label }: Props) {
  const filled = Math.min(seats, Math.max(0, boarded));
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{label}</h3>
      <p className={styles.sub}>
        Cada punto es un asiento. Relleno = pasajeros embarcados ({filled}/
        {seats}).
      </p>
      <ul
        className={styles.seatGrid}
        aria-label={`${filled} de ${seats} asientos`}
      >
        {Array.from({ length: seats }, (_, i) => (
          <li
            key={i}
            className={cn(styles.seat, i < filled && styles.seatFilled)}
            aria-hidden
          />
        ))}
      </ul>
    </div>
  );
}
