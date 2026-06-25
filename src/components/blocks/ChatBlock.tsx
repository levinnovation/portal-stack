"use client";
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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

export function ChatBlock({ title = "Asistente", agentId = "default", greeting, suggestedPrompts, chatId: initialChatId, initialMessages }: ChatBlockProps) {
  const [input, setInput] = React.useState("");
  const [chatId, setChatId] = React.useState(initialChatId);

  const { messages, sendMessage, status } = useChat({
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
              const toolParts = m.parts?.filter((p) => p.type !== "text") ?? [];
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
                    {toolParts.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                        <Wrench className="h-3.5 w-3.5" />
                        Consultando datos…
                      </div>
                    ))}
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
