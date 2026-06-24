import type { Metadata } from "next";
import "./globals.css";
import { getTenant } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: tenant.description ?? `${tenant.name} portal`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={
          {
            // expose brand color for inline use
            ["--tenant-brand" as any]: tenant.theme.brand,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
