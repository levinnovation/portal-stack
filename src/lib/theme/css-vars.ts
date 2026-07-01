import type { TenantTheme } from "@/lib/tenant";

function cssString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

// ponytail: emit only the explicit brand tokens. Surface/sidebar/chart tokens
// live in globals.css per :root/.dark so an inverted dark palette (light text on
// near-black) doesn't get a light sidebar from deriving off --primary.
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
  ].join("");
}

/** Inject tenant HSL tokens as CSS custom properties for both light and dark classes. */
export function tenantThemeCss(theme: TenantTheme): string {
  const dark = theme.colorsDark ?? theme.colors;
  return `:root{--tenant-brand:${cssString(theme.brand)};--radius:${theme.radius};${varsFor(theme.colors)}}.dark{${varsFor(dark)}}body{font-family:${theme.fonts.sans};}h1,h2,h3,h4,.font-display{font-family:${theme.fonts.display};}`;
}
