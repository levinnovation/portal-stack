import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig, type CollectionConfig } from "payload";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Documents } from "./collections/Documents";
import { Notifications } from "./collections/Notifications";
import { AuditLogs } from "./collections/AuditLogs";
import { Tenants } from "./collections/Tenants";
import { Webhooks } from "./collections/Webhooks";
import { Pages } from "./collections/Pages";
import { Datasets } from "./collections/Datasets";
import { Dashboards } from "./collections/Dashboards";
import { AIChats } from "./collections/AIChats";
import { AIMessages } from "./collections/AIMessages";

import { getTenant } from "./lib/tenant";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Resolve collections at config-load time.
 * TENANT_ID env var drives which vertical collections are registered.
 * Run-time DB overrides for theme/features are layered on top by getTenant()
 * but collections themselves are fixed at boot.
 */
function buildCollections(): CollectionConfig[] {
  const tenantId = process.env.TENANT_ID || "core";
  const baseCollections: CollectionConfig[] = [
    Users,
    Media,
    Documents,
    Notifications,
    AuditLogs,
    Tenants,
    Webhooks,
    Pages,
    Datasets,
    Dashboards,
    AIChats,
    AIMessages,
  ];
  if (tenantId === "core") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { realestateCollections } = require("../tenants/core/domain/collections");
    return [...baseCollections, ...realestateCollections];
  }
  return baseCollections;
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " · Portal Stack",
    },
  },
  collections: buildCollections(),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"],
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"],
});
