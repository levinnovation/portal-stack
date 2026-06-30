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

export async function sendTestEvent(event: MetaConversionEvent, testEventCode?: string) {
  const code = testEventCode || process.env.META_TEST_EVENT_CODE || "";
  if (!code) throw new Error("Meta test event code missing (META_TEST_EVENT_CODE)");
  return sendConversions({ events: [event], test_event_code: code });
}

export async function getEventDiagnostics() {
  return metaGraph("GET", `/${encodeURIComponent(datasetId())}`, {
    fields: "id,name,last_received_event_time,event_stats,event_match_quality,event_source_stats",
  });
}

