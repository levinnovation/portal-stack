import type { CollectionConfig } from "payload";

export const CreativeAssets: CollectionConfig = {
  slug: "creative-assets",
  upload: {
    staticDir: "public/media/creative",
    mimeTypes: ["image/*", "video/*"],
    adminThumbnail: "thumbnail",
    imageSizes: [{ name: "thumbnail", width: 400, height: 300, position: "centre" }],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "alt", type: "text", required: true },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Scored", value: "scored" },
        { label: "Published", value: "published" },
        { label: "Failed", value: "failed" },
      ],
    },
    { name: "score", type: "number" },
    { name: "scoreBreakdown", type: "json" },
    { name: "scoreFeedback", type: "textarea" },
    { name: "metaImageHash", type: "text" },
    { name: "metaVideoId", type: "text" },
    { name: "metaCreativeId", type: "text" },
  ],
};

