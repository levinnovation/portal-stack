/**
 * Block configs for Payload `type: "blocks"` layout field.
 * Runtime format: { blockType: "hero", title, ... } — matches seed TS and admin.
 */
import type { Block } from "payload";

const heroBlock: Block = {
  slug: "hero",
  labels: { singular: "Hero", plural: "Heroes" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "subtitle", type: "text" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "ctaLabel", type: "text" },
    { name: "ctaHref", type: "text" },
    { name: "background", type: "select", defaultValue: "hero", options: [
      { label: "Hero gradient (navy)", value: "hero" },
      { label: "Gold gradient", value: "gold" },
      { label: "Subtle", value: "subtle" },
    ]},
  ],
};

const kpiGridBlock: Block = {
  slug: "kpi-grid",
  labels: { singular: "KPI Grid", plural: "KPI Grids" },
  fields: [
    { name: "title", type: "text" },
    { name: "subtitle", type: "text" },
    {
      name: "cards",
      type: "array",
      minRows: 1,
      fields: [
        { name: "label", type: "text", required: true },
        {
          name: "dataset",
          type: "text",
          required: true,
          admin: { description: "Inline key (count:projects) or named dataset key" },
        },
        { name: "format", type: "select", defaultValue: "number", options: [
          { label: "Number", value: "number" },
          { label: "USD", value: "usd" },
          { label: "COP", value: "cop" },
          { label: "Percent", value: "percent" },
          { label: "Plain text", value: "text" },
        ]},
        { name: "icon", type: "text", admin: { description: "Lucide icon name" } },
      ],
    },
  ],
};

const chartBlock: Block = {
  slug: "chart",
  labels: { singular: "Chart", plural: "Charts" },
  fields: [
    { name: "title", type: "text" },
    { name: "subtitle", type: "text" },
    {
      name: "datasetRelation",
      type: "relationship",
      relationTo: "datasets",
      admin: { description: "Pick a named dataset from the library" },
    },
    {
      name: "dataset",
      type: "text",
      admin: { description: "Inline key (count:projects) — used when datasetRelation is empty" },
    },
    {
      name: "kind",
      type: "select",
      defaultValue: "line",
      options: [
        { label: "Line", value: "line" },
        { label: "Bar", value: "bar" },
        { label: "Pie", value: "pie" },
        { label: "Area", value: "area" },
      ],
    },
    { name: "height", type: "number", defaultValue: 280 },
  ],
};

const tableBlock: Block = {
  slug: "table",
  labels: { singular: "Table", plural: "Tables" },
  fields: [
    { name: "title", type: "text" },
    {
      name: "datasetRelation",
      type: "relationship",
      relationTo: "datasets",
      admin: { description: "Pick a named dataset from the library" },
    },
    {
      name: "dataset",
      type: "text",
      admin: { description: "Inline key (list:projects) — used when datasetRelation is empty" },
    },
    {
      name: "columns",
      type: "array",
      fields: [
        { name: "key", type: "text", required: true },
        { name: "label", type: "text", required: true },
        { name: "format", type: "select", defaultValue: "text", options: [
          { label: "Text", value: "text" },
          { label: "Number", value: "number" },
          { label: "USD", value: "usd" },
          { label: "Date", value: "date" },
          { label: "Status badge", value: "status" },
        ]},
      ],
    },
    { name: "pageSize", type: "number", defaultValue: 10 },
    { name: "emptyMessage", type: "text", defaultValue: "Sin datos" },
  ],
};

const formBlock: Block = {
  slug: "form",
  labels: { singular: "Form", plural: "Forms" },
  fields: [
    { name: "title", type: "text" },
    { name: "description", type: "textarea" },
    { name: "submitLabel", type: "text", defaultValue: "Enviar" },
    { name: "endpoint", type: "text", required: true },
    {
      name: "fields",
      type: "array",
      minRows: 1,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "label", type: "text", required: true },
        { name: "type", type: "select", defaultValue: "text", options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" },
          { label: "Number", value: "number" },
          { label: "Textarea", value: "textarea" },
          { label: "Date", value: "date" },
          { label: "File", value: "file" },
        ]},
        { name: "required", type: "checkbox", defaultValue: false },
      ],
    },
  ],
};

const markdownBlock: Block = {
  slug: "markdown",
  labels: { singular: "Markdown", plural: "Markdown blocks" },
  fields: [
    { name: "title", type: "text" },
    { name: "body", type: "richText" },
  ],
};

const chatBlock: Block = {
  slug: "chat",
  labels: { singular: "AI Chat", plural: "AI Chats" },
  fields: [
    { name: "title", type: "text", defaultValue: "Asistente" },
    { name: "agentId", type: "text", defaultValue: "default" },
    { name: "greeting", type: "text" },
    { name: "suggestedPrompts", type: "array", fields: [{ name: "prompt", type: "text" }] },
  ],
};

const dividerBlock: Block = {
  slug: "divider",
  labels: { singular: "Divider", plural: "Dividers" },
  fields: [
    {
      name: "size",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  ],
};

const iframeBlock: Block = {
  slug: "iframe",
  labels: { singular: "Iframe", plural: "Iframes" },
  fields: [
    { name: "title", type: "text" },
    { name: "src", type: "text", required: true },
    { name: "height", type: "number", defaultValue: 480 },
  ],
};

const columnsBlock: Block = {
  slug: "columns",
  labels: { singular: "Columns", plural: "Column layouts" },
  fields: [
    { name: "title", type: "text" },
    {
      name: "ratio",
      type: "select",
      defaultValue: "1-1",
      options: [
        { label: "50 / 50", value: "1-1" },
        { label: "66 / 33", value: "2-1" },
        { label: "33 / 66", value: "1-2" },
      ],
    },
    { name: "leftDataset", type: "text", admin: { description: "Optional table/list dataset for left column" } },
    { name: "rightDataset", type: "text", admin: { description: "Optional table/list dataset for right column" } },
    { name: "leftTitle", type: "text" },
    { name: "rightTitle", type: "text" },
  ],
};

export const LAYOUT_BLOCKS: Block[] = [
  heroBlock,
  kpiGridBlock,
  chartBlock,
  tableBlock,
  formBlock,
  markdownBlock,
  chatBlock,
  dividerBlock,
  iframeBlock,
  columnsBlock,
];

export const BLOCK_TYPES = LAYOUT_BLOCKS.map((b) => b.slug);

/** @deprecated use LAYOUT_BLOCKS — kept for normalizeLayout group fallback */
export const BLOCK_FIELDS: import("payload").Field[] = [];
