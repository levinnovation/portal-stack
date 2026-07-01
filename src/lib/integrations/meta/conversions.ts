import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { metaGraph } from "./graph";

const ACTION_SOURCES = ["website", "system_generated", "email", "phone_call", "chat", "physical_store"] as const;

const UserDataSchema = z.object({
  em: z.string().optional(),
  ph: z.string().optional(),
  external_id: z.string().optional(),
});

const CustomDataSchema = z.object({
  value: z.number().optional(),
  currency: z.string().optional(),
  content_name: z.string().optional(),
  content_category: z.string().optional(),
  content_ids: z.array(z.string()).optional(),
});

const ConversionEventSchema = z.object({
  event_name: z.string().min(1),
  event_time: z.number().int().positive(),
  action_source: z.enum(ACTION_SOURCES).default("system_generated"),
  event_id: z.string().min(6).optional(),
  event_source_url: z.string().url().optional(),
  user_data: UserDataSchema,
  custom_data: CustomDataSchema.optional(),
});

const SendConversionsSchema = z.object({
  events: z.array(ConversionEventSchema).min(1),
  test_event_code: z.string().optional(),
});

export type MetaConversionEvent = z.infer<typeof ConversionEventSchema>;

function datasetId(): string {
  const id = process.env.META_DATASET_ID?.trim();
  if (!id) throw new Error("Meta conversions is not configured (META_DATASET_ID missing)");
  return id;
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export function hashPII(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizeHashed(value?: string): string | undefined {
  if (!value) return undefined;
  return isSha256(value) ? value.toLowerCase() : hashPII(value);
}

export function buildDedupEventId(contactId: string, eventName: string, businessDay: string): string {
  return createHash("sha256").update(`${contactId}:${eventName}:${businessDay}`).digest("hex");
}

function normalizeEvent(event: MetaConversionEvent): MetaConversionEvent {
  const em = normalizeHashed(event.user_data.em);
  const ph = normalizeHashed(event.user_data.ph);
  const externalId = normalizeHashed(event.user_data.external_id);
  if (!em && !ph && !externalId) throw new Error("Meta conversion event requires at least one user_data identifier");
  return {
    ...event,
    user_data: {
      ...(em ? { em } : {}),
      ...(ph ? { ph } : {}),
      ...(externalId ? { external_id: externalId } : {}),
    },
  };
}

export async function sendConversions(input: z.input<typeof SendConversionsSchema>) {
  const payload = SendConversionsSchema.parse(input);
  const data = payload.events.map(normalizeEvent);
  return metaGraph("POST", `/${encodeURIComponent(datasetId())}/events`, {
    data: JSON.stringify(data),
    test_event_code: payload.test_event_code,
  });
}

// Test event codes are arbitrary labels the portal picks; Events Manager groups
// matching events under whatever code we send. Auto-generate one when not supplied
// so operators never have to manage META_TEST_EVENT_CODE by hand.
function generateTestEventCode(): string {
  return `TEST${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function sendTestEvent(event: MetaConversionEvent, testEventCode?: string) {
  const code = testEventCode?.trim() || process.env.META_TEST_EVENT_CODE?.trim() || generateTestEventCode();
  const result = await sendConversions({ events: [event], test_event_code: code });
  return { testEventCode: code, result };
}

export async function getEventDiagnostics() {
  // Only fields exposed on the Ads Pixel/dataset node; event_stats/EMQ are not
  // readable via a plain fields query (permission denied) and last_received_event_time
  // does not exist — requesting them returns Graph (#100).
  return metaGraph("GET", `/${encodeURIComponent(datasetId())}`, {
    fields: "id,name,last_fired_time,is_unavailable,data_use_setting,enable_automatic_matching",
  });
}

