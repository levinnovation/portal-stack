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
    const matchedRole = tenant.roles.find((r) => r.key === session.user.role);
    const redirect = matchedRole?.homePath || "/portal";
    // #region agent log
    console.log(
      "[DEBUG-AUTH] login success",
      JSON.stringify({
        hypothesisId: "H-role-mismatch",
        email: session.user.email,
        userRole: session.user.role,
        tenantRoleKeys: tenant.roles.map((r) => r.key),
        matchedRole: matchedRole?.key ?? null,
        redirect,
        nodeEnv: process.env.NODE_ENV,
      }),
    );
    // #endregion
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
    // #region agent log
    console.log(
      "[DEBUG-AUTH] login failed",
      JSON.stringify({ hypothesisId: "H-signin-error", email, error: err?.message || String(err) }),
    );
    // #endregion
    return NextResponse.json({ error: err?.message || "Error de autenticación" }, { status: 401 });
  }
}
