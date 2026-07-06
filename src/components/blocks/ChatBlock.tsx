"use client";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatConversation } from "@/components/chat/ChatConversation";

export interface ChatBlockProps {
  title?: string;
  agentId?: string;
  greeting?: string;
  suggestedPrompts?: { prompt: string }[];
  chatId?: string;
  initialMessages?: { role: "user" | "assistant" | "system"; content: string }[];
}

export function ChatBlock({ title = "Asistente", agentId = "default", greeting, suggestedPrompts, chatId: initialChatId, initialMessages }: ChatBlockProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 flex flex-col h-[520px]">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-card">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <ChatConversation
          className="flex-1 min-h-0"
          agentId={agentId}
          greeting={greeting}
          suggestedPrompts={suggestedPrompts}
          chatId={initialChatId}
          initialMessages={initialMessages}
        />
      </CardContent>
    </Card>
  );
}
