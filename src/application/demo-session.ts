import { DEMO_SESSION_COOKIE } from "@/i18n/cookies";
import { parseRoleId } from "@/domain/access";
import type { RoleId } from "@/config/access-matrix";

const MAX_AGE_SECONDS = 60 * 60 * 8;

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: RoleId | null | undefined;

function emit() {
  for (const listener of listeners) listener();
}

export function parseDemoSession(raw: string | null | undefined): RoleId | null {
  return parseRoleId(raw);
}

function readCookieValue(): RoleId | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${DEMO_SESSION_COOKIE}=([^;]*)`),
  );
  return parseDemoSession(match?.[1]);
}

export function subscribeDemoSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Cached snapshot so useSyncExternalStore does not loop. */
export function getDemoSessionSnapshot(): RoleId | null {
  const next = readCookieValue();
  if (snapshot === next) return snapshot ?? null;
  snapshot = next;
  return next;
}

export function getDemoSessionServerSnapshot(): RoleId | null {
  return null;
}

export function writeDemoSessionCookie(role: RoleId): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_SESSION_COOKIE}=${encodeURIComponent(role)};path=/;max-age=${MAX_AGE_SECONDS};samesite=lax`;
  snapshot = role;
  emit();
}

export function clearDemoSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_SESSION_COOKIE}=;path=/;max-age=0;samesite=lax`;
  snapshot = null;
  emit();
}
