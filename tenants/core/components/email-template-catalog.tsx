"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CatalogTemplate = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  active: boolean;
  preview?: { url?: string; html?: string };
  render?: { html?: string; rendererUrl?: string; rendererRef?: string };
  source?: { provider?: string; version?: string };
};

type Binding = { templateId: string; agentSlug?: string; useCase: string; active: boolean };

export function EmailTemplateCatalog({
  templates,
  bindings,
  agents,
}: {
  templates: CatalogTemplate[];
  bindings: Binding[];
  agents: { id: string; label: string }[];
}) {
  const [selectedSlug, setSelectedSlug] = useState(templates[0]?.slug || "");
  const [agentSlug, setAgentSlug] = useState("workspace");
  const [useCase, setUseCase] = useState("shell");
  const [pending, startTransition] = useTransition();
  const selected = useMemo(() => templates.find((template) => template.slug === selectedSlug), [selectedSlug, templates]);

  function mutate(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      window.location.reload();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de plantillas</CardTitle>
            <CardDescription>
              Catálogo Maizzle por slug. El HTML puede ser un snapshot temporal o una referencia a un renderer externo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay plantillas aún. Crealas en Payload Admin → Email Templates.</p>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedSlug(template.slug)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    selectedSlug === template.slug ? "border-accent bg-accent/10" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{template.name}</span>
                    <span className="block text-xs text-muted-foreground">{template.slug} · {template.source?.provider || "maizzle"} {template.source?.version || ""}</span>
                    {template.description && <span className="mt-1 block text-sm text-muted-foreground">{template.description}</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    <Label htmlFor={`active-${template.id}`} className="text-xs text-muted-foreground">Activa</Label>
                    <input
                      id={`active-${template.id}`}
                      type="checkbox"
                      checked={template.active}
                      disabled={pending}
                      onChange={(event) => mutate({ action: "set-active", templateId: template.id, active: event.target.checked })}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 accent-[hsl(var(--accent))]"
                    />
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignación</CardTitle>
            <CardDescription>La asignación por agente y caso de uso reemplaza el shell por defecto del workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Agente</Label>
              <Select value={agentSlug} onValueChange={setAgentSlug}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Shell del workspace</SelectItem>
                  {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-use-case">Caso de uso</Label>
              <Input id="email-use-case" value={useCase} onChange={(event) => setUseCase(event.target.value)} placeholder="shell" />
            </div>
            <div className="flex items-end">
              <Button
                disabled={!selected || pending}
                onClick={() => selected && mutate({ action: "assign", templateId: selected.id, agentSlug: agentSlug === "workspace" ? "" : agentSlug, useCase })}
              >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Guardar asignación
              </Button>
            </div>
          </CardContent>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {bindings.filter((binding) => binding.active).map((binding) => (
              <p key={`${binding.templateId}-${binding.agentSlug}-${binding.useCase}`}>
                {binding.agentSlug || "Workspace"} / {binding.useCase} → {templates.find((template) => template.id === binding.templateId)?.slug || "plantilla eliminada"}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>{selected?.slug || "Seleccioná una plantilla"}</CardDescription>
        </CardHeader>
        <CardContent>
          {selected?.preview?.url ? (
            <iframe title={`Vista previa: ${selected.name}`} src={selected.preview.url} sandbox="" className="h-[640px] w-full rounded-md border bg-white" />
          ) : selected?.preview?.html || selected?.render?.html ? (
            <iframe title={`Vista previa: ${selected.name}`} srcDoc={selected.preview?.html || selected.render?.html} sandbox="" className="h-[640px] w-full rounded-md border bg-white" />
          ) : selected?.render?.rendererUrl ? (
            <a href={selected.render.rendererUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
              Abrir renderer configurado <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Esta plantilla todavía no tiene HTML ni URL de vista previa.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
