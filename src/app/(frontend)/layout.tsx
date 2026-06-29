import type { Metadata } from "next";
import { cookies } from "next/headers";
import "../globals.css";
import { getTenant } from "@/lib/tenant";
import { tenantThemeCss } from "@/lib/theme/css-vars";
import { THEME_COOKIE, normalizeThemePreference } from "@/lib/theme/preference";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/strings";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";
import { PortalProviders } from "@/components/PortalProviders";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: tenant.description ?? `${tenant.name} portal`,
  };
}

/** ponytail: portal routes own <html>/<body>; Payload admin uses its own RootLayout. */
export default async function FrontendRootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  // No saved preference falls back to the tenant's brand default (CORE is dark-first).
  const savedTheme = cookieStore.get(THEME_COOKIE)?.value;
  const themePreference = savedTheme
    ? normalizeThemePreference(savedTheme)
    : tenant.theme.defaultMode ?? "system";
  const htmlLang: Locale =
    cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : DEFAULT_LOCALE;

  const themeInitScript = `(() => {
    const pref = ${JSON.stringify(themePreference)};
    const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  })();`;

  return (
    <html lang={htmlLang} suppressHydrationWarning className={themePreference === "dark" ? "dark" : undefined}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style id="tenant-theme" dangerouslySetInnerHTML={{ __html: tenantThemeCss(tenant.theme) }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PortalProviders>
          <ToastProvider>{children}</ToastProvider>
        </PortalProviders>
        <Toaster />
      </body>
    </html>
  );
}
