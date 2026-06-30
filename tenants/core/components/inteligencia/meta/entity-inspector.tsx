"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";
import { MetaSelect } from "@tenants/core/components/inteligencia/meta/meta-select";

type Json = Record<string, unknown>;

export function MetaEntityInspector() {
  const [entityId, setEntityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [entity, setEntity] = useState<Json | null>(null);
  const [adSets, setAdSets] = useState<Json[]>([]);
  const [ads, setAds] = useState<Json[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(id: string = entityId) {
    if (!id.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const entityRes = await fetch(`/api/inteligencia/meta/${encodeURIComponent(id)}?fields=id,name,status,objective,daily_budget,lifetime_budget`);
      if (!entityRes.ok) throw new Error(`Meta GET ${entityRes.status}`);
      const entityJson = (await entityRes.json()) as Json;
      setEntity(entityJson);

      const adSetRes = await fetch(`/api/inteligencia/meta/${encodeURIComponent(id)}/adsets?fields=id,name,status,daily_budget,lifetime_budget`);
      const loadedAdSets = adSetRes.ok ? ((await adSetRes.json()) as { data?: Json[] }).data || [] : [];
      setAdSets(loadedAdSets);

      const adRows: Json[] = [];
      for (const adset of loadedAdSets) {
        const adsetId = String(adset.id || "");
        if (!adsetId) continue;
        const adsRes = await fetch(`/api/inteligencia/meta/${encodeURIComponent(adsetId)}/ads?fields=id,name,status`);
        if (!adsRes.ok) continue;
        const adsJson = (await adsRes.json()) as { data?: Json[] };
        adRows.push(...(adsJson.data || []));
      }
      setAds(adRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar entidad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta Entity Inspector</p>
      <MetaSelect
        type="campaigns"
        label="Campaña (live desde Meta)"
        placeholder="Selecciona una campaña…"
        value={entityId}
        onChange={(id) => {
          setEntityId(id);
          if (id) void load(id);
        }}
      />
      <div className="flex items-center gap-2">
        <input
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          placeholder="campaign/adset/ad id"
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary/30"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          Load
        </button>
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}

      {entity ? (
        <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{String(entity.name || entity.id)}</p>
            <span className="text-xs text-muted-foreground">{String(entity.status || "unknown")}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <CommandControl
              label="Pause"
              target="meta"
              op="pauseCampaign"
              payload={{ campaignId: String(entity.id || "") }}
              description="Pausar campaña en Meta"
            />
            <CommandControl
              label="Resume"
              target="meta"
              op="resumeCampaign"
              payload={{ campaignId: String(entity.id || "") }}
              description="Reactivar campaña en Meta"
            />
            <CommandControl
              label="Delete"
              target="meta"
              op="deleteCampaign"
              payload={{ campaignId: String(entity.id || "") }}
              destructive
              variant="danger"
              description="Eliminar campaña en Meta"
            />
          </div>
          <pre className="overflow-x-auto rounded border border-border bg-background p-2 text-[11px] text-muted-foreground">
            {JSON.stringify(entity, null, 2)}
          </pre>
          {adSets.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ad sets ({adSets.length})</p>
              <div className="space-y-1">
                {adSets.slice(0, 12).map((row) => (
                  <div key={String(row.id)} className="flex items-center justify-between rounded border border-border p-1.5 text-xs">
                    <span>{String(row.name || row.id)}</span>
                    <span className="text-muted-foreground">{String(row.status || "")}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {ads.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ads ({ads.length})</p>
              <div className="space-y-1">
                {ads.slice(0, 12).map((row) => (
                  <div key={String(row.id)} className="flex items-center justify-between rounded border border-border p-1.5 text-xs">
                    <span>{String(row.name || row.id)}</span>
                    <span className="text-muted-foreground">{String(row.status || "")}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

