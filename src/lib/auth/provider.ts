/**
 * Auth provider abstraction.
 *
 * Today only LocalPayloadAuthProvider is implemented (Payload's built-in
 * email + password, JWT cookie issued by /api/auth/login).
 *
 * To plug in Agentyx (or any other OIDC/SSO), implement this interface,
 * register it in tenants/<id>/config.ts via `auth.provider = "agentyx"`,
 * and ship the AgentyxAuthProvider class. The rest of the app is agnostic.
 */

import type { Payload } from "payload";

export interface AuthSession {
  token: string;
  user: SessionUser;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthProvider {
  /** Validate a request and return the active user, or null if unauthenticated. */
  getSession(req: Request): Promise<SessionUser | null>;
  /** Issue a session for the given credentials. Returns token + user. */
  signIn(email: string, password: string): Promise<AuthSession>;
  /** Revoke the active session. */
  signOut(req: Request): Promise<void>;
}

export class LocalPayloadAuthProvider implements AuthProvider {
  constructor(private payload: Payload) {}

  async getSession(req: Request): Promise<SessionUser | null> {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const m = cookieHeader.match(/payload-token=([^;]+)/);
    if (!m) {
      // #region agent log
      console.log(
        "[DEBUG-AUTH] getSession no cookie",
        JSON.stringify({ hypothesisId: "H-no-cookie", cookieHeaderPresent: cookieHeader.length > 0, cookieHeaderLen: cookieHeader.length }),
      );
      // #endregion
      return null;
    }
    try {
      const result = await this.payload.auth({
        headers: new Headers({ cookie: `payload-token=${m[1]}` }),
      });
      if (!result.user) {
        // #region agent log
        console.log("[DEBUG-AUTH] getSession payload.auth returned no user", JSON.stringify({ hypothesisId: "H-auth-no-user" }));
        // #endregion
        return null;
      }
      const resolved = {
        id: String(result.user.id),
        email: result.user.email!,
        name: ((result.user as any).name ?? result.user.email)!,
        role: ((result.user as any).role ?? "member") as string,
      };
      // #region agent log
      console.log("[DEBUG-AUTH] getSession resolved user", JSON.stringify({ hypothesisId: "H-role-mismatch", ...resolved }));
      // #endregion
      return resolved;
    } catch (err: any) {
      // #region agent log
      console.log(
        "[DEBUG-AUTH] getSession payload.auth threw",
        JSON.stringify({ hypothesisId: "H-auth-throws", error: err?.message || String(err) }),
      );
      // #endregion
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const result = await this.payload.login({
      collection: "users",
      data: { email, password },
    });
    if (!result.token) throw new Error("Invalid credentials");
    if (!result.user) throw new Error("No user returned");
    return {
      token: result.token,
      user: {
        id: String(result.user.id),
        email: result.user.email!,
        name: ((result.user as any).name ?? result.user.email)!,
        role: ((result.user as any).role ?? "member") as string,
      },
    };
  }

  async signOut(_req: Request): Promise<void> {
    // Cookie is cleared by the route handler; nothing else to do here.
  }
}

let cached: AuthProvider | null = null;

export async function getAuthProvider(): Promise<AuthProvider> {
  if (cached) return cached;
  const { getPayloadClient } = await import("../payload");
  const { getTenant } = await import("../tenant");
  const tenant = await getTenant();
  const payload = await getPayloadClient();

  if (tenant.auth.provider === "agentyx") {
    // Future: load AgentyxAuthProvider here. For now, fall back to local with a warning.
    console.warn(
      `[auth] Tenant "${tenant.id}" declares agentyx provider but no adapter is implemented yet. Falling back to LocalPayloadAuthProvider.`,
    );
  }
  cached = new LocalPayloadAuthProvider(payload);
  return cached;
}
