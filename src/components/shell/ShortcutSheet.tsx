"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Kbd } from "@/components/ui/Kbd";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { NavShortcut } from "@/lib/shortcuts";
import styles from "./ShortcutSheet.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  shortcuts: readonly NavShortcut[];
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function ShortcutSheet({ open, onClose, shortcuts }: Props) {
  const { dict } = usePreferences();
  const t = dict.shortcutsSheet;
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  const general = [
    { keys: ["⌘", "K"], label: t.palette },
    { keys: ["?"], label: t.sheet },
    { keys: ["Esc"], label: t.close },
  ];
  const lists = [
    { keys: ["J"], label: t.next },
    { keys: ["K"], label: t.prev },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.root}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.16 }}
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t.close}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <header className={styles.head}>
              <h2 className={styles.title}>{t.title}</h2>
              <Kbd>Esc</Kbd>
            </header>
            <div className={styles.columns}>
              <section>
                <h3 className={styles.groupLabel}>{t.navigation}</h3>
                <ul className={styles.list}>
                  {shortcuts.map((s) => (
                    <li key={s.href} className={styles.item}>
                      <span>{t.goTo.replace("{view}", dict.nav[s.labelKey])}</span>
                      <span className={styles.keys}>
                        <Kbd>G</Kbd>
                        <span className={styles.then}>{t.then}</span>
                        <Kbd>{s.key.toUpperCase()}</Kbd>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <div className={styles.stack}>
                {[
                  { label: t.lists, items: lists },
                  { label: t.general, items: general },
                ].map((group) => (
                  <section key={group.label}>
                    <h3 className={styles.groupLabel}>{group.label}</h3>
                    <ul className={styles.list}>
                      {group.items.map((item) => (
                        <li key={item.label} className={styles.item}>
                          <span>{item.label}</span>
                          <span className={styles.keys}>
                            {item.keys.map((k) => (
                              <Kbd key={k}>{k}</Kbd>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
