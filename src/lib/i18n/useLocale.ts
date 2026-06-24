"use client";
/**
 * Lightweight i18n for the frontend portal.
 *
 * Ponytail: this hook reads a single cookie set by the server, no
 * URL routing changes, no i18n library. The admin panel handles its
 * own i18n via Payload; this is only for the public/portal pages.
 *
 * Add per-key translations by extending src/lib/i18n/strings.ts.
 * For complex plural/format rules, swap this for next-intl later.
 */
import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale, dict } from "./strings";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400e3).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getStoredLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const c = readCookie(LOCALE_COOKIE);
  if (c && (SUPPORTED_LOCALES as readonly string[]).includes(c)) return c as Locale;
  return DEFAULT_LOCALE;
}

export function setLocale(locale: Locale) {
  writeCookie(LOCALE_COOKIE, locale);
}

/** Ponytail: client-side t() that reads the current locale from a cookie. */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);
  return {
    locale,
    setLocale: (next: Locale) => {
      setLocale(next);
      setLocaleState(next);
    },
    t: (key: keyof typeof dict.en) => dict[locale][key] ?? dict[DEFAULT_LOCALE][key] ?? key,
  };
}
