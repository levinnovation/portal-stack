import "server-only";

import { z } from "zod";
import { assertInAccount, createAccountEdge, listAccountEdge, majorToMinorCurrency, metaGraph } from "./graph";

const CampaignCreateSchema = z.object({
  name: z.string().min(1),
  objective: z.string().min(1),
  status: z.string().default("PAUSED"),
  special_ad_categories: z.array(z.string()).default([]),
  buying_type: z.string().optional(),
});

const CampaignUpdateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().optional(),
  status: z.string().optional(),
  objective: z.string().optional(),
  dailyBudget: z.number().positive().optional(),
  lifetimeBudget: z.number().positive().optional(),
  bidStrategy: z.string().optional(),
  spendCap: z.number().positive().optional(),
  startTime: z.string().optional(),
  stopTime: z.string().optional(),
});

const AdSetCreateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  billingEvent: z.string().optional(),
  optimizationGoal: z.string().optional(),
  bidAmount: z.number().positive().optional(),
  bidStrategy: z.string().optional(),
  dailyBudget: z.number().positive().optional(),
  lifetimeBudget: z.number().positive().optional(),
  status: z.string().default("PAUSED"),
  targeting: z.record(z.any()).optional(),
  promotedObject: z.record(z.any()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const AdSetUpdateSchema = z.object({
  adSetId: z.string().min(1),
  status: z.string().optional(),
  name: z.string().optional(),
  billingEvent: z.string().optional(),
  optimizationGoal: z.string().optional(),
  bidAmount: z.number().positive().optional(),
  bidStrategy: z.string().optional(),
  dailyBudget: z.number().positive().optional(),
  lifetimeBudget: z.number().positive().optional(),
  targeting: z.record(z.any()).optional(),
  promotedObject: z.record(z.any()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const CreativeCreateSchema = z.object({
  name: z.string().min(1),
  pageId: z.string().optional(),
  instagramActorId: z.string().optional(),
  body: z.string().optional(),
  title: z.string().optional(),
  imageHash: z.string().optional(),
  videoId: z.string().optional(),
  objectStoryId: z.string().optional(),
  callToActionType: z.string().optional(),
  linkUrl: z.string().url().optional(),
});

const AdCreateSchema = z.object({
  adSetId: z.string().min(1),
  name: z.string().min(1),
  creativeId: z.string().min(1),
  status: z.string().default("PAUSED"),
});

const AdUpdateSchema = z.object({
  adId: z.string().min(1),
  name: z.string().optional(),
  status: z.string().optional(),
  creativeId: z.string().optional(),
});

const AudienceCreateSchema = z.object({
  name: z.string().min(1),
  subtype: z.enum(["CUSTOM", "LOOKALIKE"]).default("CUSTOM"),
  description: z.string().optional(),
  customerFileSource: z.string().optional(),
  originAudienceId: z.string().optional(),
  lookalikeSpec: z.record(z.any()).optional(),
});

const AudienceUpdateSchema = z.object({
  audienceId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
});

const AudienceUsersSchema = z.object({
  audienceId: z.string().min(1),
  schema: z.array(z.string()).min(1),
  data: z.array(z.array(z.string())).min(1),
  isRaw: z.boolean().default(false),
});

const normalizeBudget = (value?: number) => (value == null ? undefined : majorToMinorCurrency(value));

function withOptionalJson(base: Record<string, unknown>, key: string, value?: Record<string, unknown>) {
  if (value) base[key] = JSON.stringify(value);
}

export async function listCampaigns() {
  return listAccountEdge<{ data?: unknown[] }>("campaigns", { fields: "id,name,status,objective,daily_budget,lifetime_budget" });
}

export async function listAdSets(campaignId: string) {
  await assertInAccount(campaignId);
  return metaGraph<{ data?: unknown[] }>("GET", `/${encodeURIComponent(campaignId)}/adsets`, {
    fields: "id,name,status,daily_budget,lifetime_budget,bid_strategy,optimization_goal",
  });
}

export async function listAds(adSetId: string) {
  await assertInAccount(adSetId);
  return metaGraph<{ data?: unknown[] }>("GET", `/${encodeURIComponent(adSetId)}/ads`, {
    fields: "id,name,status,creative",
  });
}

export async function getCampaign(campaignId: string) {
  await assertInAccount(campaignId);
  return metaGraph("GET", `/${encodeURIComponent(campaignId)}`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,bid_strategy,spend_cap,start_time,stop_time",
  });
}

export async function createCampaign(input: z.input<typeof CampaignCreateSchema>) {
  const payload = CampaignCreateSchema.parse(input);
  // Meta now requires this flag on campaign create when no campaign-level budget
  // is set (ad-set budgeting). We never set a campaign budget here, so opt out.
  return createAccountEdge("campaigns", { ...payload, is_adset_budget_sharing_enabled: false });
}

export async function updateCampaign(input: z.input<typeof CampaignUpdateSchema>) {
  const payload = CampaignUpdateSchema.parse(input);
  await assertInAccount(payload.campaignId);
  return metaGraph("POST", `/${encodeURIComponent(payload.campaignId)}`, {
    name: payload.name,
    status: payload.status,
    objective: payload.objective,
    bid_strategy: payload.bidStrategy,
    daily_budget: normalizeBudget(payload.dailyBudget),
    lifetime_budget: normalizeBudget(payload.lifetimeBudget),
    spend_cap: normalizeBudget(payload.spendCap),
    start_time: payload.startTime,
    stop_time: payload.stopTime,
  });
}

export async function deleteCampaign(campaignId: string) {
  await assertInAccount(campaignId);
  return metaGraph("DELETE", `/${encodeURIComponent(campaignId)}`);
}

export async function getAdSet(adSetId: string) {
  await assertInAccount(adSetId);
  return metaGraph("GET", `/${encodeURIComponent(adSetId)}`, {
    fields:
      "id,name,status,bid_strategy,bid_amount,billing_event,optimization_goal,daily_budget,lifetime_budget,targeting,promoted_object,start_time,end_time",
  });
}

export async function createAdSet(input: z.input<typeof AdSetCreateSchema>) {
  const payload = AdSetCreateSchema.parse(input);
  await assertInAccount(payload.campaignId);
  const body: Record<string, unknown> = {
    campaign_id: payload.campaignId,
    name: payload.name,
    billing_event: payload.billingEvent,
    optimization_goal: payload.optimizationGoal,
    bid_amount: normalizeBudget(payload.bidAmount),
    bid_strategy: payload.bidStrategy,
    daily_budget: normalizeBudget(payload.dailyBudget),
    lifetime_budget: normalizeBudget(payload.lifetimeBudget),
    status: payload.status,
    start_time: payload.startTime,
    end_time: payload.endTime,
  };
  withOptionalJson(body, "targeting", payload.targeting);
  withOptionalJson(body, "promoted_object", payload.promotedObject);
  return createAccountEdge("adsets", body as any);
}

export async function updateAdSet(input: z.input<typeof AdSetUpdateSchema>) {
  const payload = AdSetUpdateSchema.parse(input);
  await assertInAccount(payload.adSetId);
  const body: Record<string, unknown> = {
    name: payload.name,
    status: payload.status,
    billing_event: payload.billingEvent,
    optimization_goal: payload.optimizationGoal,
    bid_amount: normalizeBudget(payload.bidAmount),
    bid_strategy: payload.bidStrategy,
    daily_budget: normalizeBudget(payload.dailyBudget),
    lifetime_budget: normalizeBudget(payload.lifetimeBudget),
    start_time: payload.startTime,
    end_time: payload.endTime,
  };
  withOptionalJson(body, "targeting", payload.targeting);
  withOptionalJson(body, "promoted_object", payload.promotedObject);
  return metaGraph("POST", `/${encodeURIComponent(payload.adSetId)}`, body as any);
}

export async function deleteAdSet(adSetId: string) {
  await assertInAccount(adSetId);
  return metaGraph("DELETE", `/${encodeURIComponent(adSetId)}`);
}

export async function getAd(adId: string) {
  await assertInAccount(adId);
  return metaGraph("GET", `/${encodeURIComponent(adId)}`, { fields: "id,name,status,creative,adset_id,campaign_id" });
}

export async function createAd(input: z.input<typeof AdCreateSchema>) {
  const payload = AdCreateSchema.parse(input);
  await assertInAccount(payload.adSetId);
  return createAccountEdge("ads", {
    adset_id: payload.adSetId,
    name: payload.name,
    status: payload.status,
    creative: JSON.stringify({ creative_id: payload.creativeId }),
  });
}

export async function updateAd(input: z.input<typeof AdUpdateSchema>) {
  const payload = AdUpdateSchema.parse(input);
  await assertInAccount(payload.adId);
  return metaGraph("POST", `/${encodeURIComponent(payload.adId)}`, {
    name: payload.name,
    status: payload.status,
    creative: payload.creativeId ? JSON.stringify({ creative_id: payload.creativeId }) : undefined,
  });
}

export async function deleteAd(adId: string) {
  await assertInAccount(adId);
  return metaGraph("DELETE", `/${encodeURIComponent(adId)}`);
}

export async function createAdCreative(input: z.input<typeof CreativeCreateSchema>) {
  const payload = CreativeCreateSchema.parse(input);
  const objectStorySpec =
    payload.pageId || payload.instagramActorId || payload.body || payload.title || payload.imageHash || payload.videoId
      ? {
          page_id: payload.pageId,
          instagram_actor_id: payload.instagramActorId,
          link_data: payload.linkUrl
            ? {
                link: payload.linkUrl,
                message: payload.body || "",
                image_hash: payload.imageHash,
                call_to_action: payload.callToActionType
                  ? { type: payload.callToActionType, value: { link: payload.linkUrl } }
                  : undefined,
              }
            : undefined,
          video_data: payload.videoId
            ? {
                video_id: payload.videoId,
                message: payload.body || "",
                title: payload.title || undefined,
                call_to_action: payload.callToActionType
                  ? { type: payload.callToActionType, value: payload.linkUrl ? { link: payload.linkUrl } : {} }
                  : undefined,
              }
            : undefined,
        }
      : undefined;

  return createAccountEdge("adcreatives", {
    name: payload.name,
    object_story_id: payload.objectStoryId,
    object_story_spec: objectStorySpec ? JSON.stringify(objectStorySpec) : undefined,
  });
}

export async function listCreatives() {
  return listAccountEdge<{ data?: unknown[] }>("adcreatives", {
    fields: "id,name,object_story_id,thumbnail_url,effective_object_story_id",
  });
}

export async function listCustomAudiences() {
  return listAccountEdge<{ data?: unknown[] }>("customaudiences", {
    fields: "id,name,subtype,approximate_count_lower_bound,delivery_status",
  });
}

export async function createCustomAudience(input: z.input<typeof AudienceCreateSchema>) {
  const payload = AudienceCreateSchema.parse(input);
  if (payload.subtype !== "CUSTOM") throw new Error("use createLookalike for LOOKALIKE subtype");
  return createAccountEdge("customaudiences", {
    name: payload.name,
    subtype: "CUSTOM",
    description: payload.description,
    customer_file_source: payload.customerFileSource || "USER_PROVIDED_ONLY",
  });
}

export async function createLookalike(input: z.input<typeof AudienceCreateSchema>) {
  const payload = AudienceCreateSchema.parse(input);
  if (!payload.originAudienceId) throw new Error("originAudienceId is required for lookalike");
  return createAccountEdge("customaudiences", {
    name: payload.name,
    subtype: "LOOKALIKE",
    origin_audience_id: payload.originAudienceId,
    lookalike_spec: JSON.stringify(payload.lookalikeSpec || {}),
    description: payload.description,
  });
}

export async function updateAudience(input: z.input<typeof AudienceUpdateSchema>) {
  const payload = AudienceUpdateSchema.parse(input);
  await assertInAccount(payload.audienceId);
  return metaGraph("POST", `/${encodeURIComponent(payload.audienceId)}`, {
    name: payload.name,
    description: payload.description,
  });
}

export async function deleteAudience(audienceId: string) {
  await assertInAccount(audienceId);
  return metaGraph("DELETE", `/${encodeURIComponent(audienceId)}`);
}

export async function addUsersToAudience(input: z.input<typeof AudienceUsersSchema>) {
  const payload = AudienceUsersSchema.parse(input);
  await assertInAccount(payload.audienceId);
  return metaGraph("POST", `/${encodeURIComponent(payload.audienceId)}/users`, {
    payload: JSON.stringify({
      schema: payload.schema,
      data: payload.data,
      is_raw: payload.isRaw,
    }),
  });
}

export async function removeUsersFromAudience(input: z.input<typeof AudienceUsersSchema>) {
  const payload = AudienceUsersSchema.parse(input);
  await assertInAccount(payload.audienceId);
  return metaGraph("POST", `/${encodeURIComponent(payload.audienceId)}/usersdelete`, {
    payload: JSON.stringify({
      schema: payload.schema,
      data: payload.data,
      is_raw: payload.isRaw,
    }),
  });
}

