"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  clearDemoSessionCookie,
  getDemoSessionServerSnapshot,
  getDemoSessionSnapshot,
  subscribeDemoSession,
  writeDemoSessionCookie,
} from "@/application/demo-session";
import type { RoleId } from "@/config/access-matrix";

type Ctx = {
  role: RoleId | null;
  setRole: (role: RoleId) => void;
  clearRole: () => void;
};

const DemoSessionContext = createContext<Ctx | null>(null);

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const role = useSyncExternalStore(
    subscribeDemoSession,
    getDemoSessionSnapshot,
    getDemoSessionServerSnapshot,
  );

  const setRole = useCallback((next: RoleId) => {
    writeDemoSessionCookie(next);
  }, []);

  const clearRole = useCallback(() => {
    clearDemoSessionCookie();
  }, []);

  const value = useMemo(
    () => ({ role, setRole, clearRole }),
    [role, setRole, clearRole],
  );

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession(): Ctx {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    return {
      role: null,
      setRole: () => undefined,
      clearRole: () => undefined,
    };
  }
  return ctx;
}
