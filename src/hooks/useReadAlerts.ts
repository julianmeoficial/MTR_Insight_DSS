"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-viewer "read" marks for alerts. Local UI state only: it never changes
 * the alert, its owner or its workflow (DESIGN.md §8.3, §9).
 */
const KEY = "mtr-alerts-read";
const EVENT = "mtr-alerts-read-change";
const EMPTY: readonly string[] = [];

let cache: { raw: string | null; ids: readonly string[] } = { raw: null, ids: EMPTY };

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.ids;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    cache = { raw, ids };
    return ids;
  } catch {
    return EMPTY;
  }
}

function write(ids: readonly string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // Private mode or blocked storage: marks last for this page only.
    cache = { raw: null, ids };
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useReadAlerts() {
  const readIds = useSyncExternalStore(subscribe, read, () => EMPTY);
  const isRead = useCallback((id: string) => readIds.includes(id), [readIds]);
  const setRead = useCallback(
    (id: string, value: boolean) =>
      write(value ? [...read(), id] : read().filter((x) => x !== id)),
    [],
  );
  const markAll = useCallback((ids: readonly string[]) => write([...read(), ...ids]), []);
  return { readIds, isRead, setRead, markAll };
}
