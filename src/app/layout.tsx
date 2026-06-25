import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getTenant } from "@/lib/tenant";
import { tenantThemeStyle } from "@/lib/theme/css-vars";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/strings";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: tenant.description ?? `${tenant.name} portal`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const htmlLang: Locale =
    cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : DEFAULT_LOCALE;
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={tenantThemeStyle(tenant.theme)}
      >
        {children}
      </body>
    </html>
  );
}
