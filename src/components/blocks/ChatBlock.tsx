"use client";
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChatBlockProps {
  title?: string;
  agentId?: string;
  greeting?: string;
  suggestedPrompts?: { prompt: string }[];
  chatId?: string;
  initialMessages?: { role: "user" | "assistant" | "system"; content: string }[];
}

export function ChatBlock({ title = "Asistente", agentId = "default", greeting, suggestedPrompts, chatId, initialMessages }: ChatBlockProps) {
  const [input, setInput] = React.useState("");
  const { messages, sendMessage, status } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { agentId, chatId },
    }),
    messages: initialMessages?.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role as any,
      parts: [{ type: "text" as const, text: m.content }],
    })),
  });

  const greetingMsg = greeting || "Hola, soy el asistente del portal. ¿En qué puedo ayudarte?";
  const isLoading = status === "submitted" || status === "streaming";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  function sendSuggested(prompt: string) {
    sendMessage({ text: prompt });
  }

  return (
    <Card>
      <CardContent className="p-0 flex flex-col h-[520px]">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <>
              <div className="flex items-start gap-2">
                <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[80%]">{greetingMsg}</div>
              </div>
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {suggestedPrompts.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendSuggested(s.prompt)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent-soft/40 transition-colors"
                    >
                      {s.prompt}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {messages.map((m) => {
            const text = m.parts
              ?.filter((p) => p.type === "text")
              .map((p) => (p as any).text)
              .join("") || "";
            return (
              <div key={m.id} className={cn("flex items-start gap-2", m.role === "user" ? "flex-row-reverse" : "")}>
                {m.role === "user" ? (
                  <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                ) : (
                  <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                )}
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm max-w-[80%] whitespace-pre-wrap",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-start gap-2">
              <Bot className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce" style={{ animationDelay: "120ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "240ms" }}>·</span>
                </span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={onSubmit} className="p-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading} className="bg-accent text-accent-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
