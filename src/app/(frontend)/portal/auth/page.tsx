"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/useLocale";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast({ tone: "error", title: t("auth.signIn.error"), description: j.error || "Credenciales inválidas" });
        return;
      }
      const data = await res.json();
      toast({ tone: "success", title: "Bienvenido" });
      if (data.redirect) router.push(data.redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="text-center">
          <Link href="/" className="font-display text-3xl text-accent tracking-tight">PORTAL</Link>
          <CardTitle className="mt-3">{t("auth.signIn.title")}</CardTitle>
          <CardDescription>{t("auth.signIn.help")} info@core.example</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.field.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.field.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? t("auth.signIn.signingIn") : t("auth.signIn.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
