"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Keyboard, List } from "lucide-react";

type MetaListItem = { id: string; name: string; status?: string };
type MetaListType = "campaigns" | "adsets" | "ads" | "creatives" | "audiences";

/**
 * Typed selector for Meta entities. Loads options from the account-scoped list
 * route; if it fails (e.g. credentials not yet configured) it transparently
 * falls back to a manual id input so the builder stays usable.
 */
export function MetaSelect({
  type,
  parentId,
  value,
  onChange,
  label,
  placeholder = "Selecciona…",
  disabled = false,
}: {
  type: MetaListType;
  parentId?: string;
  value: string;
  onChange: (id: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<MetaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  async function load() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (parentId) params.set("parentId", parentId);
      const res = await fetch(`/api/inteligencia/meta-list?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setItems((json.items as MetaListItem[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
      setManual(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (type === "adsets" || type === "ads") {
      if (parentId) void load();
      else {
        setItems([]);
      }
    } else {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, parentId]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setManual((m) => !m)}
            className="inline-flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            title={manual ? "Usar lista" : "Ingresar id manual"}
          >
            {manual ? <List className="h-3 w-3" /> : <Keyboard className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || disabled}
            className="inline-flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Recargar"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {manual ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} id`}
          disabled={disabled}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
        >
          <option value="">{placeholder}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.status ? ` · ${item.status}` : ""}
            </option>
          ))}
        </select>
      )}
      {error ? <p className="text-[10px] text-amber-400">{error} — usando id manual</p> : null}
    </div>
  );
}
