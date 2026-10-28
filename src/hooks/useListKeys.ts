"use client";

import { useEffect } from "react";

/** True when a key event comes from a text field or an open dialog. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.closest('[role="dialog"]'));
}

/**
 * J / K move the selection through `ids` (DESIGN.md §8.2).
 * Wraps neither end; ignores modifier keys and text input.
 */
export function useListKeys(
  ids: readonly string[],
  selected: string | null,
  onSelect: (id: string) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || ids.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key !== "j" && key !== "k") return;
      const index = selected ? ids.indexOf(selected) : -1;
      const next =
        key === "j"
          ? Math.min(ids.length - 1, index + 1)
          : Math.max(0, index === -1 ? 0 : index - 1);
      const id = ids[next];
      if (id && id !== selected) {
        e.preventDefault();
        onSelect(id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, selected, onSelect, enabled]);
}
