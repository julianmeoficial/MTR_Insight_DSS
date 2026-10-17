"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";
import styles from "./CommandPalette.module.css";

export type CommandPaletteGroup = {
  id: string;
  label: string;
  items: { id: string; label: string; hint?: string; onSelect: () => void }[];
};

type Props = {
  groups: CommandPaletteGroup[];
  placeholder: string;
  emptyLabel: string;
  closeLabel: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPalette({
  groups,
  placeholder,
  emptyLabel,
  closeLabel,
  className,
  open: openControlled,
  onOpenChange,
}: Props) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openControlled ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, [setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open, setOpen]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        q ? item.label.toLowerCase().includes(q) : true,
      ),
    }))
    .filter((g) => g.items.length > 0);

  if (!open) return null;

  return (
    <div className={styles.root} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label={closeLabel}
        onClick={close}
      />
      <div
        className={cn(styles.dialog, className)}
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
      >
        <div className={styles.searchRow}>
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className={styles.results}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>{emptyLabel}</p>
          ) : (
            filtered.map((group) => (
              <section key={group.id} className={styles.group}>
                <h3 className={styles.groupLabel}>{group.label}</h3>
                <ul className={styles.list}>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={styles.item}
                        onClick={() => {
                          item.onSelect();
                          close();
                        }}
                      >
                        <span>{item.label}</span>
                        {item.hint ? (
                          <span className={styles.hint}>{item.hint}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
