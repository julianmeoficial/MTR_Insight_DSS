import { cookies } from "next/headers";
import { parseDemoSession } from "@/application/demo-session";
import { DEMO_SESSION_COOKIE } from "@/i18n/cookies";
import type { RoleId } from "@/config/access-matrix";

export async function readDemoRole(): Promise<RoleId | null> {
  const jar = await cookies();
  return parseDemoSession(jar.get(DEMO_SESSION_COOKIE)?.value);
}
