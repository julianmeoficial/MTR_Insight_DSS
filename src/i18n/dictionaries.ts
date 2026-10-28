import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

export type Locale = "es" | "en";

export const dictionaries = {
  es,
  en,
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}

export function formatAlertMessage(
  locale: Locale,
  trigger: "K1_RED_STREAK" | "SOURCE_NOT_LOADED",
  params: { weeks?: number; source?: string },
): string {
  const d = getDictionary(locale);
  if (trigger === "K1_RED_STREAK") {
    return d.alerts.k1RedStreak.replace(
      "{weeks}",
      String(params.weeks ?? ""),
    );
  }
  return d.alerts.sourceNotLoaded.replace(
    "{source}",
    params.source ?? "",
  );
}

/** Replace `{key}` placeholders in a dictionary string. */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
