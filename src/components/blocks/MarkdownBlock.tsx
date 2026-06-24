"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface MarkdownBlockProps {
  title?: string;
  body?: any; // Lexical rich text JSON
}

export function MarkdownBlock({ title, body }: MarkdownBlockProps) {
  return (
    <Card>
      <CardContent className="p-6 prose prose-sm max-w-none">
        {title && <h3 className="font-display text-xl mb-2 not-prose">{title}</h3>}
        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
          {JSON.stringify(body ?? {}, null, 2)}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Renderizado de Lexical rich text — añadir @payloadcms/richtext-lexical/react renderer en fase siguiente.
        </p>
      </CardContent>
    </Card>
  );
}
