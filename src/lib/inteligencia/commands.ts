import "server-only";

import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { getPayloadClient } from "@/lib/payload";
import { quickbaseUpdateRecord, quickbaseUpsert } from "@/lib/integrations/quickbase";
import { updateContact } from "@/lib/integrations/hubspot-write";
import { CONTRATO_FIDS } from "@tenants/core/sources/quickbase";
import { env as coreEnv } from "@tenants/core/lib/env";
import * as marketing from "@/lib/integrations/meta/marketing";
import { buildDedupEventId, getEventDiagnostics, sendConversions, sendTestEvent } from "@/lib/integrations/meta/conversions";
import { uploadAdImage, uploadAdVideo } from "@/lib/integrations/meta/assets";

const BaseEnvelopeSchema = z.object({
  target: z.string().min(1),
  op: z.string().min(1),
  payload: z.unknown().default({}),
});

type CommandContext = {
  actorId?: number | string | null;
  ipAddress?: string;
};

type CommandEntry = {
  schema: z.ZodTypeAny;
  run: (payload: any) => Promise<unknown>;
  entityType: string;
  entityId?: (payload: any, result: unknown) => string | undefined;
  destructive?: boolean;
};

export type CommandCatalogEntry = {
  key: string;
  destructive: boolean;
};

const COMMANDS: Record<string, CommandEntry> = {
  "meta.pauseCampaign": {
    schema: z.object({ campaignId: z.string().min(1) }),
    run: ({ campaignId }) => marketing.updateCampaign({ campaignId, status: "PAUSED" }),
    entityType: "meta_campaign",
    entityId: ({ campaignId }) => campaignId,
  },
  "meta.resumeCampaign": {
    schema: z.object({ campaignId: z.string().min(1) }),
    run: ({ campaignId }) => marketing.updateCampaign({ campaignId, status: "ACTIVE" }),
    entityType: "meta_campaign",
    entityId: ({ campaignId }) => campaignId,
  },
  "meta.updateCampaign": {
    schema: z.object({
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
    }),
    run: marketing.updateCampaign,
    entityType: "meta_campaign",
    entityId: ({ campaignId }) => campaignId,
  },
  "meta.createCampaign": {
    schema: z.object({
      name: z.string().min(1),
      objective: z.string().min(1),
      status: z.string().default("PAUSED"),
      special_ad_categories: z.array(z.string()).default([]),
    }),
    run: marketing.createCampaign,
    entityType: "meta_campaign",
  },
  "meta.deleteCampaign": {
    schema: z.object({ campaignId: z.string().min(1) }),
    run: ({ campaignId }) => marketing.deleteCampaign(campaignId),
    entityType: "meta_campaign",
    entityId: ({ campaignId }) => campaignId,
    destructive: true,
  },
  "meta.createAdSet": {
    schema: z.object({
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
    }),
    run: marketing.createAdSet,
    entityType: "meta_adset",
  },
  "meta.updateAdSet": {
    schema: z.object({
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
    }),
    run: marketing.updateAdSet,
    entityType: "meta_adset",
    entityId: ({ adSetId }) => adSetId,
  },
  "meta.deleteAdSet": {
    schema: z.object({ adSetId: z.string().min(1) }),
    run: ({ adSetId }) => marketing.deleteAdSet(adSetId),
    entityType: "meta_adset",
    entityId: ({ adSetId }) => adSetId,
    destructive: true,
  },
  "meta.createAd": {
    schema: z.object({
      adSetId: z.string().min(1),
      name: z.string().min(1),
      creativeId: z.string().min(1),
      status: z.string().default("PAUSED"),
    }),
    run: marketing.createAd,
    entityType: "meta_ad",
  },
  "meta.updateAd": {
    schema: z.object({
      adId: z.string().min(1),
      name: z.string().optional(),
      status: z.string().optional(),
      creativeId: z.string().optional(),
    }),
    run: marketing.updateAd,
    entityType: "meta_ad",
    entityId: ({ adId }) => adId,
  },
  "meta.deleteAd": {
    schema: z.object({ adId: z.string().min(1) }),
    run: ({ adId }) => marketing.deleteAd(adId),
    entityType: "meta_ad",
    entityId: ({ adId }) => adId,
    destructive: true,
  },
  "meta.createCustomAudience": {
    schema: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      customerFileSource: z.string().optional(),
    }),
    run: (payload) => marketing.createCustomAudience({ ...payload, subtype: "CUSTOM" }),
    entityType: "meta_audience",
  },
  "meta.createLookalikeAudience": {
    schema: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      originAudienceId: z.string().min(1),
      lookalikeSpec: z.record(z.any()).optional(),
    }),
    run: (payload) => marketing.createLookalike({ ...payload, subtype: "LOOKALIKE" }),
    entityType: "meta_audience",
  },
  "meta.updateAudience": {
    schema: z.object({
      audienceId: z.string().min(1),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    run: marketing.updateAudience,
    entityType: "meta_audience",
    entityId: ({ audienceId }) => audienceId,
  },
  "meta.deleteAudience": {
    schema: z.object({ audienceId: z.string().min(1) }),
    run: ({ audienceId }) => marketing.deleteAudience(audienceId),
    entityType: "meta_audience",
    entityId: ({ audienceId }) => audienceId,
    destructive: true,
  },
  "meta.sendConversion": {
    schema: z.object({
      contactId: z.string().min(1),
      eventName: z.string().min(1),
      eventTime: z.number().int().positive().optional(),
      businessDay: z.string().min(8),
      userData: z.object({
        em: z.string().optional(),
        ph: z.string().optional(),
        external_id: z.string().optional(),
      }),
      customData: z.object({ value: z.number().optional(), currency: z.string().optional() }).optional(),
      actionSource: z.string().optional(),
    }),
    run: async (payload) =>
      sendConversions({
        events: [
          {
            event_name: payload.eventName,
            event_time: payload.eventTime || Math.floor(Date.now() / 1000),
            action_source: payload.actionSource || "system_generated",
            event_id: buildDedupEventId(payload.contactId, payload.eventName, payload.businessDay),
            user_data: payload.userData,
            custom_data: payload.customData,
          },
        ],
      }),
    entityType: "meta_conversion",
    entityId: ({ contactId }) => contactId,
  },
  "meta.sendTestEvent": {
    schema: z.object({
      eventName: z.string().min(1),
      userData: z.object({
        em: z.string().optional(),
        ph: z.string().optional(),
        external_id: z.string().optional(),
      }),
      customData: z.object({ value: z.number().optional(), currency: z.string().optional() }).optional(),
      testEventCode: z.string().optional(),
    }),
    run: ({ eventName, userData, customData, testEventCode }) =>
      sendTestEvent(
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "system_generated",
          user_data: userData,
          custom_data: customData,
        },
        testEventCode,
      ),
    entityType: "meta_conversion",
  },
  "meta.getDiagnostics": {
    schema: z.object({}),
    run: () => getEventDiagnostics(),
    entityType: "meta_conversion",
  },
  "meta.publishCreative": {
    schema: z.object({
      creativeAssetId: z.union([z.string(), z.number()]),
      creativeName: z.string().min(1),
      body: z.string().optional(),
      title: z.string().optional(),
      pageId: z.string().optional(),
      instagramActorId: z.string().optional(),
      callToActionType: z.string().optional(),
      linkUrl: z.string().url().optional(),
      attachToAdId: z.string().optional(),
    }),
    run: async (payload) => {
      const p = await getPayloadClient();
      const asset = await p.findByID({
        collection: "creative-assets" as any,
        id: payload.creativeAssetId as string | number,
        depth: 0,
        overrideAccess: true,
      });
      const mimeType = String((asset as any).mimeType || "");
      if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
        throw new Error("Creative asset mimeType not supported");
      }
      const url = String((asset as any).url || "");
      let imageHash: string | undefined;
      let videoId: string | undefined;
      if (mimeType.startsWith("image/")) {
        const uploaded = await uploadAdImage({ url, name: payload.creativeName });
        const first = Object.values((uploaded as any).images || {})[0] as { hash?: string } | undefined;
        imageHash = first?.hash;
      } else {
        const uploaded = await uploadAdVideo({ url, title: payload.creativeName });
        videoId = String((uploaded as any).id || "");
      }
      const creative = await marketing.createAdCreative({
        name: payload.creativeName,
        body: payload.body,
        title: payload.title,
        pageId: payload.pageId,
        instagramActorId: payload.instagramActorId,
        imageHash,
        videoId,
        callToActionType: payload.callToActionType,
        linkUrl: payload.linkUrl,
      });
      const creativeId = String((creative as any).id || "");
      if (payload.attachToAdId && creativeId) {
        await marketing.updateAd({ adId: payload.attachToAdId, creativeId });
      }
      await p.update({
        collection: "creative-assets" as any,
        id: payload.creativeAssetId as string | number,
        data: {
          status: "published",
          metaImageHash: imageHash,
          metaVideoId: videoId,
          metaCreativeId: creativeId,
        },
        overrideAccess: true,
      });
      return { creativeId, imageHash, videoId };
    },
    entityType: "meta_creative_asset",
    entityId: ({ creativeAssetId }) => String(creativeAssetId),
  },
  "hubspot.updateContact": {
    schema: z.object({
      contactId: z.string().min(1),
      properties: z.record(z.string(), z.string()),
    }),
    run: ({ contactId, properties }) => updateContact({ contactId, properties }),
    entityType: "hubspot_contact",
    entityId: ({ contactId }) => contactId,
  },
  "quickbase.upsert": {
    schema: z.object({
      tableId: z.string().min(1),
      record: z.record(z.object({ value: z.any() })),
    }),
    run: ({ tableId, record }) => quickbaseUpsert(tableId, record),
    entityType: "quickbase_record",
  },
  // Named, validated update for the Contratos table. UI passes logical field names
  // (not magic FIDs); only allowlisted writable fields are mapped server-side.
  "quickbase.updateContrato": {
    schema: z
      .object({
        recordId: z.union([z.string(), z.number()]),
        fields: z
          .object({
            firstTouchSource: z.string().min(1).optional(),
            firstTouchCampaign: z.string().min(1).optional(),
            firstTouchChannel: z.string().min(1).optional(),
            leahAttributed: z.boolean().optional(),
          })
          .refine((f) => Object.values(f).some((v) => v !== undefined), {
            message: "At least one field is required",
          }),
      }),
    run: ({ recordId, fields }) =>
      quickbaseUpdateRecord({
        tableId: coreEnv.CORE_QB_CONTRATOS_TABLE_ID,
        recordId,
        fieldMap: {
          firstTouchSource: CONTRATO_FIDS.firstTouchSource,
          firstTouchCampaign: CONTRATO_FIDS.firstTouchCampaign,
          firstTouchChannel: CONTRATO_FIDS.firstTouchChannel,
          leahAttributed: CONTRATO_FIDS.leahAttributed,
        },
        values: fields,
        keyFieldId: CONTRATO_FIDS.recordId,
      }),
    entityType: "quickbase_record",
    entityId: ({ recordId }) => String(recordId),
  },
};

export function listCommandKeys(): string[] {
  return Object.keys(COMMANDS).sort();
}

export function listCommandCatalog(): CommandCatalogEntry[] {
  return Object.entries(COMMANDS)
    .map(([key, command]) => ({ key, destructive: !!command.destructive }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function resolveCommand(key: string): CommandEntry | undefined {
  return COMMANDS[key];
}

export async function executeChartCommand(input: unknown, ctx: CommandContext = {}) {
  const env = BaseEnvelopeSchema.parse(input);
  const key = `${env.target}.${env.op}`;
  const command = COMMANDS[key];
  if (!command) throw new Error(`Unsupported command: ${key}`);
  const payload = command.schema.parse(env.payload);
  const result = await command.run(payload);
  await writeAuditLog({
    actorId: ctx.actorId,
    ipAddress: ctx.ipAddress,
    action: key,
    entityType: command.entityType,
    entityId: command.entityId?.(payload, result),
    metadata: {
      payload,
      result,
      destructive: !!command.destructive,
    },
  });
  return { key, destructive: !!command.destructive, result };
}

