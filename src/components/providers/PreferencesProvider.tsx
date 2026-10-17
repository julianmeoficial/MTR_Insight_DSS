"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  dictionaries,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/i18n/dictionaries";
import { LOCALE_COOKIE, THEME_COOKIE, type ThemePreference } from "@/i18n/cookies";

type Ctx = {
  theme: ThemePreference;
  locale: Locale;
  dict: Dictionary;
  setTheme: (t: ThemePreference) => void;
  setLocale: (l: Locale) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

type Store = {
  theme: ThemePreference;
  locale: Locale;
};

const SERVER_SNAP: Store = { theme: "dark", locale: "es" };
let store: Store = SERVER_SNAP;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Store {
  return store;
}

function getServerSnapshot(): Store {
  return SERVER_SNAP;
}

function applyTheme(theme: ThemePreference) {
  if (store.theme === theme) return;
  store = { ...store, theme };
  document.documentElement.setAttribute("data-theme", theme);
  writeCookie(THEME_COOKIE, theme);
  emit();
}

function applyLocale(locale: Locale) {
  if (store.locale === locale) return;
  store = { ...store, locale };
  document.documentElement.lang = locale;
  writeCookie(LOCALE_COOKIE, locale);
  emit();
}

type Props = {
  children: React.ReactNode;
  initialTheme: ThemePreference;
  initialLocale: Locale;
};

export function PreferencesProvider({ children }: Props) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const t = readCookie(THEME_COOKIE);
    const l = readCookie(LOCALE_COOKIE);
    const theme: ThemePreference =
      t === "light" || t === "dark" ? t : "dark";
    const locale: Locale = l === "en" || l === "es" ? l : "es";
    store = { theme, locale };
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.lang = locale;
    emit();
  }, []);

  const setTheme = useCallback((t: ThemePreference) => applyTheme(t), []);
  const setLocale = useCallback((l: Locale) => applyLocale(l), []);
  const toggleTheme = useCallback(() => {
    applyTheme(store.theme === "dark" ? "light" : "dark");
  }, []);
  const toggleLocale = useCallback(() => {
    applyLocale(store.locale === "es" ? "en" : "es");
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      theme: snap.theme,
      locale: snap.locale,
      dict: getDictionary(snap.locale),
      setTheme,
      setLocale,
      toggleTheme,
      toggleLocale,
    }),
    [snap.theme, snap.locale, setTheme, setLocale, toggleTheme, toggleLocale],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Ctx {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    return {
      theme: "dark",
      locale: "es",
      dict: dictionaries.es,
      setTheme: () => undefined,
      setLocale: () => undefined,
      toggleTheme: () => undefined,
      toggleLocale: () => undefined,
    };
  }
  return ctx;
}
