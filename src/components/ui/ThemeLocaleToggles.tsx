"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { IconButton } from "@/components/ui/IconButton";
import styles from "./ThemeLocaleToggles.module.css";

export function ThemeLocaleToggles() {
  const { theme, locale, dict, toggleTheme, toggleLocale } = usePreferences();

  return (
    <div className={styles.row}>
      <IconButton
        label={theme === "dark" ? dict.themeLight : dict.themeDark}
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <Sun strokeWidth={1.5} aria-hidden />
        ) : (
          <Moon strokeWidth={1.5} aria-hidden />
        )}
      </IconButton>
      <IconButton
        label={locale === "es" ? dict.langEn : dict.langEs}
        onClick={toggleLocale}
      >
        <Languages strokeWidth={1.5} aria-hidden />
      </IconButton>
    </div>
  );
}
