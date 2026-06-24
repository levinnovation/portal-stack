import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LandingPage() {
  const tenant = await getTenant();
  return (
    <div className="min-h-screen bg-background">
      <nav className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-accent tracking-tight">{tenant.theme.brand}</Link>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-primary-foreground/80 hover:text-accent hidden md:inline">Admin CMS</Link>
          <Link href="/portal/auth">
            <Button variant="ghost" className="text-primary-foreground hover:text-accent hover:bg-transparent">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative h-[88vh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-95" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 30%, rgba(206,154,70,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(56,78,121,0.35) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 h-full flex items-center px-8 md:px-16 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <div className="text-accent text-xs tracking-[0.3em] uppercase mb-6">{tenant.name}</div>
            <h1 className="font-display text-5xl md:text-7xl text-primary-foreground leading-[1.05] mb-6">
              {tenant.name}.<br />
              <span className="text-accent italic">Transparente.</span>
            </h1>
            <p className="text-lg text-primary-foreground/75 max-w-xl mb-10 leading-relaxed">
              {tenant.description}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/portal/auth">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
                  Acceder al portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Panel administrativo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-accent text-xs tracking-[0.3em] uppercase mb-3">Construido sobre Portal Stack</div>
          <h2 className="font-display text-4xl md:text-5xl">Next.js 15 + Payload CMS 3 + AI Agent in-app.</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {["Next.js 15", "Payload CMS 3", "Postgres", "Lexical", "TypeScript", "Tailwind", "AI SDK 5", "Layout Builder", "Multi-tenant"].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full border border-border bg-card">
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 px-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {tenant.name}
      </footer>
    </div>
  );
}
