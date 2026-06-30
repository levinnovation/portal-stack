"use client";
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Send, Bot, User as UserIcon, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ChatBlockProps {
  title?: string;
  agentId?: string;
  greeting?: string;
  suggestedPrompts?: { prompt: string }[];
  chatId?: string;
  initialMessages?: { role: "user" | "assistant" | "system"; content: string }[];
}

type CommandCatalogEntry = { key: string; destructive: boolean };
type ToolPartLike = {
  type?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  toolCallId?: string;
  errorText?: string;
};

export function ChatBlock({ title = "Asistente", agentId = "default", greeting, suggestedPrompts, chatId: initialChatId, initialMessages }: ChatBlockProps) {
  const [input, setInput] = React.useState("");
  const [chatId, setChatId] = React.useState(initialChatId);
  const [commandsByKey, setCommandsByKey] = React.useState<Record<string, CommandCatalogEntry>>({});
  const [confirmTextByCall, setConfirmTextByCall] = React.useState<Record<string, string>>({});
  const [runningCalls, setRunningCalls] = React.useState<Record<string, boolean>>({});

  const { messages, sendMessage, addToolOutput, status } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { agentId, chatId },
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        const newId = res.headers.get("X-Chat-Id");
        if (newId && newId !== chatId) setChatId(newId);
        return res;
      },
    }),
    messages: initialMessages?.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role as "user" | "assistant" | "system",
      parts: [{ type: "text" as const, text: m.content }],
    })),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const greetingMsg = greeting || "Hola, soy el asistente del portal. ¿En qué puedo ayudarte?";
  const isLoading = status === "submitted" || status === "streaming";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  function messageText(m: (typeof messages)[0]): string {
    return (
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("") ?? ""
    );
  }

  React.useEffect(() => {
    let alive = true;
    const loadCatalog = async () => {
      try {
        const res = await fetch("/api/inteligencia/command", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { commands?: CommandCatalogEntry[] };
        if (!alive || !Array.isArray(json.commands)) return;
        setCommandsByKey(
          Object.fromEntries(json.commands.map((entry) => [entry.key, entry])),
        );
      } catch {
        // Non-admin sessions should fail silently and keep chat read-only.
      }
    };
    loadCatalog();
    return () => {
      alive = false;
    };
  }, []);

  function asToolPart(part: unknown): ToolPartLike | null {
    if (!part || typeof part !== "object") return null;
    const p = part as ToolPartLike;
    if (typeof p.type !== "string" || !p.type.startsWith("tool-")) return null;
    return p;
  }

  function toolName(part: ToolPartLike): string {
    return String(part.type || "").replace(/^tool-/, "");
  }

  function actionFromInput(input: unknown): { target: string; op: string; payload: Record<string, unknown> } | null {
    if (!input || typeof input !== "object") return null;
    const candidate = input as { target?: unknown; op?: unknown; payload?: unknown };
    if (typeof candidate.target !== "string" || typeof candidate.op !== "string") return null;
    const payload =
      candidate.payload && typeof candidate.payload === "object" && !Array.isArray(candidate.payload)
        ? (candidate.payload as Record<string, unknown>)
        : {};
    return { target: candidate.target, op: candidate.op, payload };
  }

  async function runPortalAction(part: ToolPartLike) {
    const callId = part.toolCallId;
    const action = actionFromInput(part.input);
    if (!callId || !action) return;
    const commandKey = `${action.target}.${action.op}`;
    const isDestructive = !!commandsByKey[commandKey]?.destructive;
    if (isDestructive && (confirmTextByCall[callId] || "").trim().toUpperCase() !== "CONFIRM") return;

    setRunningCalls((prev) => ({ ...prev, [callId]: true }));
    try {
      const res = await fetch("/api/inteligencia/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const output = await res.json().catch(() => ({ error: "Invalid JSON response" }));
      if (!res.ok) {
        addToolOutput({
          tool: "execute_portal_action",
          toolCallId: callId,
          state: "output-error",
          errorText: String((output as { detail?: string; error?: string })?.detail || (output as { error?: string })?.error || "No se pudo ejecutar el comando"),
        });
        return;
      }
      addToolOutput({
        tool: "execute_portal_action",
        toolCallId: callId,
        output,
      });
    } catch (e: any) {
      addToolOutput({
        tool: "execute_portal_action",
        toolCallId: callId,
        state: "output-error",
        errorText: e?.message || "No se pudo ejecutar el comando",
      });
    } finally {
      setRunningCalls((prev) => ({ ...prev, [callId]: false }));
      setConfirmTextByCall((prev) => ({ ...prev, [callId]: "" }));
    }
  }

  function cancelPortalAction(part: ToolPartLike) {
    const callId = part.toolCallId;
    if (!callId) return;
    addToolOutput({
      tool: "execute_portal_action",
      toolCallId: callId,
      output: { cancelled: true },
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 flex flex-col h-[520px]">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-card">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-4 pr-3">
            {messages.length === 0 && (
              <>
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[85%]">{greetingMsg}</div>
                </div>
                {suggestedPrompts && suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-7">
                    {suggestedPrompts.map((s, i) => (
                      <Button key={i} type="button" variant="outline" size="sm" className="rounded-full h-auto py-1.5 text-xs" onClick={() => sendMessage({ text: s.prompt })} disabled={isLoading}>
                        {s.prompt}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
            {messages.map((m) => {
              const toolParts = (m.parts ?? []).map(asToolPart).filter((p): p is ToolPartLike => !!p);
              const text = messageText(m);
              return (
                <div key={m.id} className={cn("flex items-start gap-2", m.role === "user" ? "flex-row-reverse" : "")}>
                  {m.role === "user" ? (
                    <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  ) : (
                    <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-2 max-w-[85%]">
                    {text && (
                      <div
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm whitespace-pre-wrap",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {text}
                      </div>
                    )}
                    {toolParts.map((p, i) => {
                      const name = toolName(p);
                      const callId = p.toolCallId || `${m.id}-${i}`;
                      if (name === "execute_portal_action" && p.state === "input-available") {
                        const action = actionFromInput(p.input);
                        const commandKey = action ? `${action.target}.${action.op}` : "unknown";
                        const isDestructive = !!commandsByKey[commandKey]?.destructive;
                        return (
                          <div key={callId} className="space-y-2 rounded-md border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              <Wrench className="h-3.5 w-3.5" />
                              Ejecutar acción: {commandKey}
                            </div>
                            {action && (
                              <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-background/80 p-2 text-[11px] text-foreground">
                                {JSON.stringify(action.payload, null, 2)}
                              </pre>
                            )}
                            {isDestructive && (
                              <Input
                                value={confirmTextByCall[callId] || ""}
                                onChange={(e) =>
                                  setConfirmTextByCall((prev) => ({ ...prev, [callId]: e.target.value }))
                                }
                                placeholder='Escribe "CONFIRM" para continuar'
                                className="h-8 text-xs"
                                disabled={!!runningCalls[callId]}
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="gold"
                                className="h-8 text-xs"
                                onClick={() => runPortalAction(p)}
                                disabled={
                                  !!runningCalls[callId] ||
                                  (isDestructive && (confirmTextByCall[callId] || "").trim().toUpperCase() !== "CONFIRM")
                                }
                              >
                                {runningCalls[callId] ? "Ejecutando…" : "Confirmar"}
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => cancelPortalAction(p)} disabled={!!runningCalls[callId]}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      if (name === "execute_portal_action" && p.state === "output-available") {
                        return (
                          <div key={callId} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                            <Wrench className="h-3.5 w-3.5" />
                            Acción ejecutada.
                          </div>
                        );
                      }

                      if (name === "execute_portal_action" && p.state === "output-error") {
                        return (
                          <div key={callId} className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            <Wrench className="h-3.5 w-3.5" />
                            {p.errorText || "No se pudo ejecutar la acción."}
                          </div>
                        );
                      }

                      return (
                        <div key={callId} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                          <Wrench className="h-3.5 w-3.5" />
                          Consultando datos…
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-start gap-2">
                <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div className="bg-muted px-3 py-2 rounded-lg text-sm text-muted-foreground animate-pulse">Escribiendo…</div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={onSubmit} className="p-3 border-t border-border flex gap-2 bg-card">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="gold" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
