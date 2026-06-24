/**
 * Shared block field schema. Imported by both the Pages and Dashboards
 * collections to compose dashboards from typed blocks.
 *
 * Each block has a `blockType` discriminator and a `props` object whose
 * shape is enforced by the matching component in src/components/blocks.
 *
 * To add a new block type:
 *  1. Add an entry to the array below.
 *  2. Implement the corresponding component in src/components/blocks/.
 *  3. Register it in src/lib/blocks/renderer.tsx.
 */
import type { Field } from "payload";

const heroBlock: Field = {
  name: "hero",
  type: "group",
  label: "Hero",
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

const kpiGridBlock: Field = {
  name: "kpi-grid",
  type: "group",
  label: "KPI Grid",
  fields: [
    { name: "title", type: "text" },
    { name: "subtitle", type: "text" },
    {
      name: "cards",
      type: "array",
      minRows: 1,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "dataset", type: "text", required: true, admin: { description: "Dataset key, e.g. count:projects" } },
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

const chartBlock: Field = {
  name: "chart",
  type: "group",
  label: "Chart",
  fields: [
    { name: "title", type: "text" },
    { name: "subtitle", type: "text" },
    { name: "dataset", type: "text", required: true, admin: { description: "Dataset key returning array of points" } },
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

const tableBlock: Field = {
  name: "table",
  type: "group",
  label: "Table",
  fields: [
    { name: "title", type: "text" },
    { name: "dataset", type: "text", required: true, admin: { description: "Dataset key returning array of rows" } },
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

const formBlock: Field = {
  name: "form",
  type: "group",
  label: "Form",
  fields: [
    { name: "title", type: "text" },
    { name: "description", type: "textarea" },
    { name: "submitLabel", type: "text", defaultValue: "Enviar" },
    { name: "endpoint", type: "text", required: true, admin: { description: "POST endpoint that handles submission" } },
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
        ]},
        { name: "required", type: "checkbox", defaultValue: false },
      ],
    },
  ],
};

const markdownBlock: Field = {
  name: "markdown",
  type: "group",
  label: "Markdown / Rich text",
  fields: [
    { name: "title", type: "text" },
    { name: "body", type: "richText" },
  ],
};

const chatBlock: Field = {
  name: "chat",
  type: "group",
  label: "AI Chat",
  fields: [
    { name: "title", type: "text", defaultValue: "Asistente" },
    { name: "agentId", type: "text", defaultValue: "default", admin: { description: "Identifier for the AI agent (mapped to system prompt in tenants/<id>/ai/)" } },
    { name: "greeting", type: "text" },
    { name: "suggestedPrompts", type: "array", fields: [{ name: "prompt", type: "text" }] },
  ],
};

const dividerBlock: Field = {
  name: "divider",
  type: "group",
  label: "Divider / Spacer",
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

const iframeBlock: Field = {
  name: "iframe",
  type: "group",
  label: "Embedded iframe",
  fields: [
    { name: "title", type: "text" },
    { name: "src", type: "text", required: true },
    { name: "height", type: "number", defaultValue: 480 },
  ],
};

export const BLOCK_FIELDS: Field[] = [
  heroBlock,
  kpiGridBlock,
  chartBlock,
  tableBlock,
  formBlock,
  markdownBlock,
  chatBlock,
  dividerBlock,
  iframeBlock,
];

export const BLOCK_TYPES = BLOCK_FIELDS.map((b) => (b as any).name) as string[];
