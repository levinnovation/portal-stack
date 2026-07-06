import type { Payload } from "payload";

export function isStaffRole(role: string): boolean {
  return role === "admin" || role === "superadmin";
}

export async function investorIdsForUser(payload: Payload, userId: string): Promise<string[]> {
  const r = await payload.find({
    collection: "investors",
    where: { user: { equals: userId } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  });
  return (r.docs as any[]).map((d) => String(d.id));
}

export async function customerIdForUser(payload: Payload, userId: string): Promise<string | null> {
  const r = await payload.find({
    collection: "customers",
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = (r.docs as any[])[0];
  return doc ? String(doc.id) : null;
}

export async function projectIdsForInvestors(payload: Payload, investorIds: string[]): Promise<string[]> {
  if (!investorIds.length) return [];
  const r = await payload.find({
    collection: "investments",
    where: { investor: { in: investorIds } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  return [...new Set((r.docs as any[]).map((i) => String(i.project)).filter(Boolean))];
}

export async function investmentIdsForInvestors(payload: Payload, investorIds: string[]): Promise<string[]> {
  if (!investorIds.length) return [];
  const r = await payload.find({
    collection: "investments",
    where: { investor: { in: investorIds } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  return (r.docs as any[]).map((i) => String(i.id));
}

export async function projectIdsForCustomer(payload: Payload, customerId: string): Promise<string[]> {
  const sales = await payload.find({
    collection: "sales",
    where: { customer: { equals: customerId } },
    limit: 50,
    depth: 1,
    overrideAccess: true,
  });
  const ids = new Set<string>();
  for (const sale of sales.docs as any[]) {
    const project = sale.unit?.project;
    if (project) ids.add(String(typeof project === "object" ? project.id : project));
  }
  return [...ids];
}
