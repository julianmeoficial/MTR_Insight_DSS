"use client";

import dynamic from "next/dynamic";
import styles from "./ApronAmbience.module.css";

const ApronCanvas = dynamic(
  () => import("@/components/ambiance/ApronCanvas").then((m) => m.ApronCanvas),
  { ssr: false },
);

type Props = {
  opacity?: number;
};

export function ApronAmbience({ opacity = 0.95 }: Props) {
  return (
    <div className={styles.host} style={{ opacity }} aria-hidden>
      <ApronCanvas />
      <div className={styles.grain} />
    </div>
  );
}
