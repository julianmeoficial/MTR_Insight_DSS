"use client";

import { usePathname } from "next/navigation";
import { canAccessRoute } from "@/domain/access";
import { UnauthorizedState } from "@/components/ui/UnauthorizedState";
import type { RoleId } from "@/config/access-matrix";

type Props = {
  role: RoleId;
  children: React.ReactNode;
};

export function AccessGate({ role, children }: Props) {
  const pathname = usePathname();
  if (!canAccessRoute(role, pathname)) {
    return <UnauthorizedState role={role} />;
  }
  return children;
}
