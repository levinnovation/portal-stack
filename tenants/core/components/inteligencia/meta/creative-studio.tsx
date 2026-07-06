"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";

type CreativeAsset = {
  id: string | number;
  url?: string;
  filename?: string;
  mimeType?: string;
  name?: string;
  status?: string;
  score?: number;
  scoreBreakdown?: Record<string, unknown>;
  metaCreativeId?: string;
};

export function CreativeStudio() {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CreativeAsset | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inteligencia/creative", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { docs?: CreativeAsset[] };
      const rows = json.docs || [];
      setAssets(rows);
      if (!selected && rows[0]) setSelected(rows[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar assets");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("name", file.name);
      form.set("alt", file.name);
      const res = await fetch("/api/inteligencia/creative", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      await load();
      if (json.asset) setSelected(json.asset as CreativeAsset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onScore(asset: CreativeAsset) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inteligencia/creative/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativeAssetId: asset.id,
          context: { platform: "meta_ads" },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      await load();
      setSelected(json.asset as CreativeAsset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Score failed");
    } finally {
      setBusy(false);
    }
  }

  const scoreLines = useMemo(() => {
    if (!selected?.scoreBreakdown) return [];
    return Object.entries(selected.scoreBreakdown)
      .filter(([k]) => ["overall", "hook", "clarity", "brandFit", "cta", "predictedCtrBand"].includes(k))
      .map(([k, v]) => `${k}: ${String(v)}`);
  }, [selected]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Creative Studio</p>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-secondary/30">
          <Upload className="h-3 w-3" />
          Upload
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      {busy ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Working...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px,1fr]">
        <div className="space-y-1 rounded border border-border bg-secondary/20 p-2">
          {assets.length ? (
            assets.map((asset) => (
              <button
                key={String(asset.id)}
                onClick={() => setSelected(asset)}
                className={`w-full rounded border px-2 py-1 text-left text-xs transition ${
                  selected?.id === asset.id ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-secondary/40"
                }`}
              >
                <div className="truncate font-medium">{asset.name || asset.filename || `Asset ${asset.id}`}</div>
                <div className="text-[11px] text-muted-foreground">{asset.status || "draft"}</div>
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No assets yet.</p>
          )}
        </div>

        <div className="space-y-2 rounded border border-border bg-secondary/20 p-2">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{selected.name || selected.filename}</p>
                <span className="text-xs text-muted-foreground">{selected.status || "draft"}</span>
              </div>
              {selected.url ? (
                selected.mimeType?.startsWith("video/") ? (
                  <video src={selected.url} controls className="max-h-64 w-full rounded border border-border bg-black/30" />
                ) : (
                  <img src={selected.url} alt={selected.name || "creative"} className="max-h-64 w-full rounded border border-border object-contain bg-black/30" />
                )
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onScore(selected)}
                  className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/20"
                >
                  <Sparkles className="h-3 w-3" />
                  Score
                </button>
                <CommandControl
                  label="Publish to Meta"
                  target="meta"
                  op="publishCreative"
                  payload={{ creativeAssetId: selected.id, creativeName: selected.name || selected.filename || `creative-${selected.id}` }}
                  description="Sube el asset y crea un ad creative en Meta"
                  onSuccess={() => {
                    void load();
                  }}
                />
                {selected.metaCreativeId ? <span className="text-xs text-muted-foreground">Creative ID: {selected.metaCreativeId}</span> : null}
              </div>
              {typeof selected.score === "number" ? (
                <div className="rounded border border-border bg-background p-2 text-xs">
                  <p className="font-semibold text-foreground">Score: {selected.score}</p>
                  <div className="mt-1 space-y-0.5 text-muted-foreground">
                    {scoreLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Selecciona un asset para previsualizar.</p>
          )}
        </div>
      </div>
    </div>
  );
}

