import type { TenantTheme } from "@/lib/tenant";

/** Inject tenant HSL tokens as CSS custom properties on :root/body. */
export function tenantThemeStyle(theme: TenantTheme): React.CSSProperties {
  const c = theme.colors;
  return {
    ["--tenant-brand" as string]: theme.brand,
    ["--background" as string]: c.background,
    ["--foreground" as string]: c.foreground,
    ["--primary" as string]: c.primary,
    ["--primary-foreground" as string]: c.primaryForeground,
    ["--accent" as string]: c.accent,
    ["--accent-foreground" as string]: c.accentForeground,
    ["--border" as string]: c.border,
    ["--ring" as string]: c.ring,
    fontFamily: theme.fonts.sans,
  } as React.CSSProperties;
}
