"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type ThemePreference } from "@/lib/theme/preference";

function writeCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 86400e3).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  async function persist(next: ThemePreference) {
    writeCookie(THEME_COOKIE, next);
    setSaving(true);
    try {
      await fetch("/api/portal/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ themePreference: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleTheme() {
    const root = document.documentElement;
    const next = isDark ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    setIsDark(next === "dark");
    await persist(next);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      disabled={saving}
      className="gap-2"
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
    </Button>
  );
}
