import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/provider";
import { resolveTenantRole } from "@/lib/auth/resolve-tenant-role";
import { getTenant } from "@/lib/tenant";
import { THEME_COOKIE } from "@/lib/theme/preference";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }
  try {
    const provider = await getAuthProvider();
    const session = await provider.signIn(email, password);
    const tenant = await getTenant();
    const role = resolveTenantRole(tenant, session.user.role);
    if (!role) {
      return NextResponse.json(
        { error: "Tu rol no tiene acceso al portal. Usa una cuenta admin, investor o customer." },
        { status: 403 },
      );
    }
    const redirect = role.homePath;
    // #region agent log
    console.log(
      "[DEBUG-AUTH] login success",
      JSON.stringify({
        hypothesisId: "H-role-mismatch",
        email: session.user.email,
        userRole: session.user.role,
        tenantRoleKeys: tenant.roles.map((r) => r.key),
        matchedRole: role.key ?? null,
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
    res.cookies.set(THEME_COOKIE, session.user.themePreference, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
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
