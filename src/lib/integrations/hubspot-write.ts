import "server-only";

import { z } from "zod";
import { resolveIntegrationToken } from "./credentials";

const ALLOWED_CONTACT_PROPERTIES = new Set([
  "hs_lead_status",
  "hubspot_owner_id",
  "next_best_action",
  "agent_next_action",
  "notes_last_contact",
]);

const UpdateContactSchema = z.object({
  contactId: z.string().min(1),
  properties: z.record(z.string(), z.string()),
});

function hubspotToken(): string {
  const token = resolveIntegrationToken("hubspot") || process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HubSpot write integration is not configured");
  return token;
}

export function assertHubspotWritableProperties(properties: Record<string, string>) {
  const keys = Object.keys(properties);
  if (!keys.length) throw new Error("HubSpot update requires at least one property");
  const invalid = keys.filter((k) => !ALLOWED_CONTACT_PROPERTIES.has(k));
  if (invalid.length) throw new Error(`HubSpot properties not allowed: ${invalid.join(", ")}`);
}

export async function updateContact(input: z.input<typeof UpdateContactSchema>) {
  const payload = UpdateContactSchema.parse(input);
  assertHubspotWritableProperties(payload.properties);
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(payload.contactId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${hubspotToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: payload.properties }),
      cache: "no-store",
    },
  );
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }
  if (!res.ok) {
    const msg = body?.message || body?.error || `HubSpot HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return {
    status: "ok",
    hubspot_contact_id: payload.contactId,
    updated_properties: payload.properties,
    body,
  };
}

