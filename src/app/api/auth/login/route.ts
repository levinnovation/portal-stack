import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/provider";
import { getTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }
  try {
    const provider = await getAuthProvider();
    const session = await provider.signIn(email, password);
    const tenant = await getTenant();
    const redirect = tenant.roles.find((r) => r.key === session.user.role)?.homePath || "/portal";

    const res = NextResponse.json({ ok: true, redirect });
    res.cookies.set(tenant.auth.cookieName, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * tenant.auth.sessionDays,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error de autenticación" }, { status: 401 });
  }
}
