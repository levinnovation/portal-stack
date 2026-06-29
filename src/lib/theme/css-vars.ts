import type { TenantTheme } from "@/lib/tenant";

function cssString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

function varsFor(c: TenantTheme["colors"]): string {
  return [
    `--background:${c.background};`,
    `--foreground:${c.foreground};`,
    `--primary:${c.primary};`,
    `--primary-foreground:${c.primaryForeground};`,
    `--primary-glow:${c.primaryGlow};`,
    `--accent:${c.accent};`,
    `--accent-foreground:${c.accentForeground};`,
    `--accent-soft:${c.accentSoft};`,
    `--success:${c.success};`,
    `--warning:${c.warning};`,
    `--destructive:${c.destructive};`,
    `--border:${c.border};`,
    `--ring:${c.ring};`,
    // ponytail: derive side-nav/chart tokens from theme accents to keep one source of truth.
    `--sidebar-background:${c.primary};`,
    `--sidebar-foreground:${c.primaryForeground};`,
    `--sidebar-primary:${c.accent};`,
    `--sidebar-primary-foreground:${c.accentForeground};`,
    `--sidebar-accent:${c.primaryGlow};`,
    `--sidebar-accent-foreground:${c.primaryForeground};`,
    `--sidebar-border:${c.border};`,
    `--sidebar-ring:${c.ring};`,
    `--chart-1:${c.accent};`,
    `--chart-2:${c.primary};`,
    `--chart-3:${c.primaryGlow};`,
    `--chart-4:${c.foreground};`,
    `--chart-5:${c.warning};`,
  ].join("");
}

/** Inject tenant HSL tokens as CSS custom properties for both light and dark classes. */
export function tenantThemeCss(theme: TenantTheme): string {
  const dark = theme.colorsDark ?? theme.colors;
  return `:root{--tenant-brand:${cssString(theme.brand)};--radius:${theme.radius};${varsFor(theme.colors)}}.dark{${varsFor(dark)}}body{font-family:${theme.fonts.sans};}h1,h2,h3,h4,.font-display{font-family:${theme.fonts.display};}`;
}
