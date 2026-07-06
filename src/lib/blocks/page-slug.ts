/** Map portal URL prefix → role key used in seeded page slugs (e.g. admin-projects). */
const PREFIX_ROLE: Record<string, string> = {
  "/portal/admin": "admin",
  "/portal/investor": "investor",
  "/portal/customer": "customer",
};

/** Candidate slugs to try when resolving a catch-all URL segment to a Pages record. */
export function resolvePageSlugCandidates(slugPath: string, portalPrefix?: string): string[] {
  const slug = slugPath.replace(/^\/+/, "").replace(/\/$/, "");
  if (!slug) return [];
  const out = [slug];
  const roleKey = portalPrefix ? PREFIX_ROLE[portalPrefix] : undefined;
  if (roleKey) {
    out.push(`${roleKey}-${slug}`);
    if (slug.includes("/")) out.push(`${roleKey}-${slug.replace(/\//g, "-")}`);
  }
  return [...new Set(out)];
}

/** First nav path segment after role home → slug candidates for self-checks. */
export function navPathToSlugCandidates(navPath: string, homePath: string): string[] {
  const prefix = homePath.replace(/\/$/, "");
  const rest = navPath.startsWith(prefix) ? navPath.slice(prefix.length).replace(/^\//, "") : navPath;
  if (!rest) return [""];
  return resolvePageSlugCandidates(rest, prefix || undefined);
}
