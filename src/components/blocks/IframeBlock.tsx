"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface IframeBlockProps {
  title?: string;
  src: string;
  height?: number;
}

export function IframeBlock({ title, src, height = 480 }: IframeBlockProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {title && <div className="px-6 py-3 border-b border-border font-medium text-sm">{title}</div>}
        <iframe src={src} height={height} className="w-full border-0" sandbox="allow-scripts allow-same-origin" />
      </CardContent>
    </Card>
  );
}
