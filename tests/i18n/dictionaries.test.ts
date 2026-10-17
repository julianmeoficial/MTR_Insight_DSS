import { describe, expect, it } from "vitest";
import { dictionaries } from "@/i18n/dictionaries";

describe("i18n dictionaries", () => {
  it("keeps matching keys in es and en", () => {
    const esKeys = Object.keys(dictionaries.es).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it("uses real Spanish punctuation in hero copy", () => {
    expect(dictionaries.es.heroTitle).toContain("Montería");
    expect(dictionaries.es.footerDisclaimer).toMatch(/Airplan/);
  });
});
