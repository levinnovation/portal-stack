"use client";

import { useMemo, useState } from "react";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";
import { MetaSelect } from "@tenants/core/components/inteligencia/meta/meta-select";

const OBJECTIVES = [
  "OUTCOME_LEADS",
  "OUTCOME_SALES",
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_AWARENESS",
  "OUTCOME_APP_PROMOTION",
] as const;

const STATUSES = ["PAUSED", "ACTIVE"] as const;

const OPTIMIZATION_GOALS = [
  "LEAD_GENERATION",
  "OFFSITE_CONVERSIONS",
  "LINK_CLICKS",
  "REACH",
  "IMPRESSIONS",
  "LANDING_PAGE_VIEWS",
] as const;

const BILLING_EVENTS = ["IMPRESSIONS", "LINK_CLICKS"] as const;

export function MetaBuilder() {
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState<(typeof OBJECTIVES)[number]>("OUTCOME_LEADS");
  const [campaignStatus, setCampaignStatus] = useState<(typeof STATUSES)[number]>("PAUSED");

  const [campaignId, setCampaignId] = useState("");
  const [adSetName, setAdSetName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("25");
  const [optimizationGoal, setOptimizationGoal] = useState<(typeof OPTIMIZATION_GOALS)[number]>("LEAD_GENERATION");
  const [billingEvent, setBillingEvent] = useState<(typeof BILLING_EVENTS)[number]>("IMPRESSIONS");

  const [adSetId, setAdSetId] = useState("");
  const [adName, setAdName] = useState("");
  const [creativeId, setCreativeId] = useState("");

  const [audienceName, setAudienceName] = useState("");
  const [originAudienceId, setOriginAudienceId] = useState("");

  const canCampaign = useMemo(() => campaignName.trim().length > 1, [campaignName]);
  const canAdSet = useMemo(() => adSetName.trim().length > 1 && campaignId.trim().length > 1, [adSetName, campaignId]);
  const budgetNumber = Number(dailyBudget || 0);
  const canAd = useMemo(
    () => adName.trim().length > 1 && adSetId.trim().length > 1 && creativeId.trim().length > 1,
    [adName, adSetId, creativeId],
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta Builder</p>

      {/* 1) Campaign */}
      <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
        <p className="text-xs font-medium text-foreground">1) Campaign</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Campaign name"
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <select
            value={campaignObjective}
            onChange={(e) => setCampaignObjective(e.target.value as (typeof OBJECTIVES)[number])}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            value={campaignStatus}
            onChange={(e) => setCampaignStatus(e.target.value as (typeof STATUSES)[number])}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <CommandControl
            label="Create campaign"
            target="meta"
            op="createCampaign"
            payload={{ name: campaignName, objective: campaignObjective, status: campaignStatus, special_ad_categories: [] }}
            className="w-full justify-center"
            description="Crear campaña en Meta Ads"
            onSuccess={(result) => {
              const id = String((result as any)?.id || "");
              if (id) setCampaignId(id);
            }}
          />
        </div>
        {!canCampaign ? <p className="text-[11px] text-muted-foreground">Completa al menos nombre y objetivo.</p> : null}
      </div>

      {/* 2) Ad Set */}
      <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
        <p className="text-xs font-medium text-foreground">2) Ad Set</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <MetaSelect type="campaigns" value={campaignId} onChange={setCampaignId} label="Campaign" />
          <input
            value={adSetName}
            onChange={(e) => setAdSetName(e.target.value)}
            placeholder="Ad set name"
            className="self-end rounded border border-border bg-background px-2 py-1 text-xs"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Daily budget (major)</span>
            <input
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              inputMode="decimal"
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Optimization goal</span>
            <select
              value={optimizationGoal}
              onChange={(e) => setOptimizationGoal(e.target.value as (typeof OPTIMIZATION_GOALS)[number])}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
            >
              {OPTIMIZATION_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Billing event</span>
            <select
              value={billingEvent}
              onChange={(e) => setBillingEvent(e.target.value as (typeof BILLING_EVENTS)[number])}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
            >
              {BILLING_EVENTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <CommandControl
            label="Create ad set"
            target="meta"
            op="createAdSet"
            payload={{
              campaignId,
              name: adSetName,
              status: "PAUSED",
              dailyBudget: budgetNumber > 0 ? budgetNumber : 25,
              optimizationGoal,
              billingEvent,
            }}
            className="w-full justify-center self-end"
            description="Crear ad set en Meta"
            onSuccess={(result) => {
              const id = String((result as any)?.id || "");
              if (id) setAdSetId(id);
            }}
          />
        </div>
        {!canAdSet ? <p className="text-[11px] text-muted-foreground">Selecciona campaña e ingresa nombre de ad set.</p> : null}
      </div>

      {/* 3) Ad */}
      <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
        <p className="text-xs font-medium text-foreground">3) Ad</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <MetaSelect type="adsets" parentId={campaignId} value={adSetId} onChange={setAdSetId} label="Ad set" />
          <MetaSelect type="creatives" value={creativeId} onChange={setCreativeId} label="Creative" />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            value={adName}
            onChange={(e) => setAdName(e.target.value)}
            placeholder="Ad name"
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <CommandControl
            label="Create ad"
            target="meta"
            op="createAd"
            payload={{ adSetId, name: adName, creativeId, status: "PAUSED" }}
            className="w-full justify-center"
            description="Crear anuncio en Meta"
          />
        </div>
        {!canAd ? <p className="text-[11px] text-muted-foreground">Selecciona ad set + creative e ingresa nombre.</p> : null}
      </div>

      {/* 4) Audience */}
      <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
        <p className="text-xs font-medium text-foreground">4) Audience</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            value={audienceName}
            onChange={(e) => setAudienceName(e.target.value)}
            placeholder="Audience name"
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <CommandControl
            label="Create custom audience"
            target="meta"
            op="createCustomAudience"
            payload={{ name: audienceName, description: "Created from portal-stack" }}
            className="w-full justify-center"
            description="Crear custom audience"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <MetaSelect type="audiences" value={originAudienceId} onChange={setOriginAudienceId} label="Origin audience (LAL)" />
          <CommandControl
            label="Create lookalike"
            target="meta"
            op="createLookalikeAudience"
            payload={{ name: `${audienceName || "LAL"}-LAL`, originAudienceId, lookalikeSpec: { ratio: 0.01 } }}
            className="w-full justify-center"
            description="Crear lookalike audience (requiere origin audience)"
          />
        </div>
      </div>
    </div>
  );
}
