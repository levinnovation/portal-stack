"use client";

import * as React from "react";
import { Maximize2, MessageCircle, Minimize2, X } from "lucide-react";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FloatingChatProps {
  title?: string;
  agentId?: string;
  greeting?: string;
  suggestedPrompts?: { prompt: string }[];
}

export function FloatingChat({
  title = "Asistente",
  agentId = "default",
  greeting,
  suggestedPrompts,
}: FloatingChatProps) {
  const [open, setOpen] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-end justify-end">
      <div
        className={cn(
          "pointer-events-auto mb-3 flex h-[600px] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all duration-200",
          maximized && "fixed bottom-4 right-4 h-[90vh] w-[min(960px,95vw)]",
          !open && "pointer-events-none translate-y-3 scale-95 opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="text-sm font-medium">{title}</div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setMaximized((prev) => !prev)}
              aria-label={maximized ? "Restaurar chat" : "Maximizar chat"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
              aria-label="Minimizar chat"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setOpen(false);
                setMaximized(false);
              }}
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChatConversation
          className="flex-1 min-h-0"
          agentId={agentId}
          greeting={greeting}
          suggestedPrompts={suggestedPrompts}
        />
      </div>

      <Button
        type="button"
        size="icon"
        variant="gold"
        className={cn(
          "pointer-events-auto h-12 w-12 rounded-full shadow-lg transition-opacity",
          open && "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(true)}
        aria-label="Abrir chat"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
