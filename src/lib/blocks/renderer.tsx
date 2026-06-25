import * as React from "react";
import { HeroBlock, type HeroBlockProps } from "@/components/blocks/HeroBlock";
import { KpiGridBlock, type KpiGridBlockProps } from "@/components/blocks/KpiGridBlock";
import { ChartBlock, type ChartBlockProps } from "@/components/blocks/ChartBlock";
import { TableBlock, type TableBlockProps } from "@/components/blocks/TableBlock";
import { FormBlock, type FormBlockProps } from "@/components/blocks/FormBlock";
import { MarkdownBlock, type MarkdownBlockProps } from "@/components/blocks/MarkdownBlock";
import { DividerBlock } from "@/components/blocks/DividerBlock";
import { IframeBlock, type IframeBlockProps } from "@/components/blocks/IframeBlock";
import { ChatBlock, type ChatBlockProps } from "@/components/blocks/ChatBlock";
import { ColumnsBlock, type ColumnsBlockProps } from "@/components/blocks/ColumnsBlock";
import type { DatasetResult } from "@/lib/datasets/runner";

/**
 * BlockRenderer — maps a `layout` array (from a Pages record) to React.
 * Each block receives its props and a `data` map containing the resolved
 * datasets it references.
 */
export interface BlockRendererProps {
  layout: any[];
  data: Record<string, DatasetResult>;
}

export function BlockRenderer({ layout, data }: BlockRendererProps) {
  return (
    <div className="space-y-6">
      {layout.map((block, i) => {
        const blockType = block.blockType;
        const props = { ...block };
        delete props.blockType;
        // Inject resolved dataset values by key
        Object.keys(props).forEach((k) => {
          if (typeof props[k] === "string" && props[k] in data) {
            // Inline dataset (block.dataset === "key:collection")
          }
        });
        switch (blockType) {
          case "hero":
            return <HeroBlock key={i} {...(props as HeroBlockProps)} />;
          case "kpi-grid":
            return <KpiGridBlock key={i} {...(props as KpiGridBlockProps)} data={data as any} />;
          case "chart":
            return <ChartBlock key={i} {...(props as ChartBlockProps)} data={data[props.dataset]} />;
          case "table":
            return <TableBlock key={i} {...(props as TableBlockProps)} data={data[props.dataset]} />;
          case "form":
            return <FormBlock key={i} {...(props as FormBlockProps)} />;
          case "markdown":
            return <MarkdownBlock key={i} {...(props as MarkdownBlockProps)} />;
          case "divider":
            return <DividerBlock key={i} {...props} />;
          case "iframe":
            return <IframeBlock key={i} {...(props as IframeBlockProps)} />;
          case "chat":
            return <ChatBlock key={i} {...(props as ChatBlockProps)} />;
          case "columns":
            return <ColumnsBlock key={i} {...(props as ColumnsBlockProps)} data={data as any} />;
          default:
            return (
              <div key={i} className="bg-card border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
                Unknown block: {blockType}
              </div>
            );
        }
      })}
    </div>
  );
}
