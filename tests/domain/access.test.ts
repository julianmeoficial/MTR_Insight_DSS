import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/config/access-matrix";
import {
  allowedNavHrefs,
  canAccessRoute,
  canExport,
  grantedScreens,
  homeForRole,
  operatorScope,
  parseRoleId,
  resolveOperatorFilter,
  visibleOperators,
} from "@/domain/access";

const EXPECTED_SCREENS: Record<RoleId, readonly string[]> = {
  junta: ["P1", "P4", "P6"],
  gerencia_general: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  gerencia_mtr: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  comercial: ["P1", "P2", "P5"],
  juridica: ["P1", "P3"],
  infraestructura: ["P4", "P6"],
  coordinacion: ["P2", "P3", "P4"],
  ti: ["P7"],
  satena: ["P2"],
  copa: ["P2"],
  ani: ["P3", "P4"],
};

describe("demo access matrix", () => {
  it("grants the Paso 10 screens to each staging role", () => {
    for (const role of ROLE_IDS) {
      expect(grantedScreens(role)).toEqual(EXPECTED_SCREENS[role]);
    }
  });

  it("denies routes outside the role and never opens decisiones", () => {
    expect(canAccessRoute("junta", "/p2")).toBe(false);
    expect(canAccessRoute("junta", "/p1")).toBe(true);
    expect(canAccessRoute("ti", "/p1")).toBe(false);
    expect(canAccessRoute("satena", "/p7")).toBe(false);
    expect(canAccessRoute("gerencia_general", "/decisiones")).toBe(false);
    expect(canAccessRoute("gerencia_general", "/p3/")).toBe(true);
  });

  it("adds alertas only with P1 and escenarios only with P6", () => {
    expect(allowedNavHrefs("junta")).toEqual([
      "/p1",
      "/p4",
      "/p6",
      "/alertas",
      "/escenarios",
    ]);
    expect(allowedNavHrefs("comercial")).toContain("/alertas");
    expect(allowedNavHrefs("comercial")).not.toContain("/escenarios");
    expect(allowedNavHrefs("infraestructura")).toEqual([
      "/p4",
      "/p6",
      "/escenarios",
    ]);
    expect(allowedNavHrefs("ti")).toEqual(["/p7"]);
    for (const href of ["/p1", "/p2", "/p3", "/p4", "/p5", "/p6"]) {
      expect(allowedNavHrefs("ti")).not.toContain(href);
    }
  });

  it("sends each role to its first granted screen", () => {
    expect(homeForRole("junta")).toBe("/p1");
    expect(homeForRole("infraestructura")).toBe("/p4");
    expect(homeForRole("coordinacion")).toBe("/p2");
    expect(homeForRole("ti")).toBe("/p7");
    expect(homeForRole("satena")).toBe("/p2");
    expect(homeForRole("ani")).toBe("/p3");
  });

  it("isolates Satena and Copa and leaves other roles unscoped", () => {
    expect(operatorScope("satena")).toBe("Satena");
    expect(operatorScope("copa")).toBe("Copa");
    expect(operatorScope("gerencia_mtr")).toBeNull();
    expect(visibleOperators("satena")).toEqual(["Satena"]);
    expect(visibleOperators("copa")).toEqual(["Copa"]);
    expect(resolveOperatorFilter("satena", "Copa")).toBe("Satena");
    expect(resolveOperatorFilter("copa", "Todos")).toBe("Copa");
    expect(resolveOperatorFilter("comercial", "Satena")).toBe("Satena");
    expect(resolveOperatorFilter("comercial", undefined)).toBe("Todos");
  });

  it("keeps export off for airlines, ANI and international coordination", () => {
    expect(canExport("satena")).toBe(false);
    expect(canExport("copa")).toBe(false);
    expect(canExport("ani")).toBe(false);
    expect(canExport("coordinacion")).toBe(false);
    expect(canExport("ti")).toBe(true);
    expect(canExport("junta")).toBe(true);
  });

  it("rejects unknown session values", () => {
    expect(parseRoleId(null)).toBeNull();
    expect(parseRoleId("")).toBeNull();
    expect(parseRoleId("admin")).toBeNull();
    expect(parseRoleId("satena")).toBe("satena");
    expect(parseRoleId("%20ti")).toBeNull();
  });
});
