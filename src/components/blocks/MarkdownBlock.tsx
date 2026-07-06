"use client";
import * as React from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Card, CardContent } from "@/components/ui/card";

export interface MarkdownBlockProps {
  title?: string;
  body?: any;
}

export function MarkdownBlock({ title, body }: MarkdownBlockProps) {
  return (
    <Card>
      <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
        {title && <h3 className="font-display text-xl mb-2 not-prose">{title}</h3>}
        {body ? <RichText data={body} /> : <p className="text-muted-foreground text-sm">Sin contenido.</p>}
      </CardContent>
    </Card>
  );
}
