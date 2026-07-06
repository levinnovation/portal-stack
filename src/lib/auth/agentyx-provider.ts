import type { Payload } from "payload";
import type { AuthProvider, AuthSession, SessionUser } from "./provider";
import { LocalPayloadAuthProvider } from "./provider";

/**
 * Agentyx SSO via JWKS — ponytail: stub until agentyx-better-auth contract is wired.
 * Set auth.provider = "agentyx" + agentyxJwksUrl in tenant config to opt in.
 */
export class AgentyxAuthProvider implements AuthProvider {
  private local: LocalPayloadAuthProvider;

  constructor(payload: Payload, readonly jwksUrl?: string) {
    this.local = new LocalPayloadAuthProvider(payload);
  }

  async getSession(req: Request): Promise<SessionUser | null> {
    // ponytail: JWKS validation ships later; fall back to local cookie session
    if (this.jwksUrl) {
      console.warn("[auth] Agentyx JWKS validation not implemented — falling back to local session");
    }
    return this.local.getSession(req);
  }

  async signIn(_email: string, _password: string): Promise<AuthSession> {
    throw new Error("Agentyx sign-in not implemented — configure OIDC redirect flow");
  }

  async signOut(req: Request): Promise<void> {
    return this.local.signOut(req);
  }
}
