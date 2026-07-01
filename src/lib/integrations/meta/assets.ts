import "server-only";

import { z } from "zod";
import { listAccountEdge } from "./graph";

const ImageUploadSchema = z.object({
  bytes: z.instanceof(Buffer).optional(),
  url: z.string().url().optional(),
  name: z.string().optional(),
});

const VideoUploadSchema = z.object({
  bytes: z.instanceof(Buffer).optional(),
  url: z.string().url().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

function requireSource({ bytes, url }: { bytes?: Buffer; url?: string }) {
  if (!bytes && !url) throw new Error("Meta asset upload requires bytes or url");
}

export async function uploadAdImage(input: z.input<typeof ImageUploadSchema>) {
  const payload = ImageUploadSchema.parse(input);
  requireSource(payload);
  if (payload.bytes) {
    return listAccountEdge<{ images?: Record<string, { hash: string }> }>("adimages", {
      bytes: payload.bytes.toString("base64"),
      name: payload.name || "creative-image",
    });
  }
  return listAccountEdge<{ images?: Record<string, { hash: string }> }>("adimages", {
    url: payload.url!,
    name: payload.name || "creative-image",
  });
}

export async function uploadAdVideo(input: z.input<typeof VideoUploadSchema>) {
  const payload = VideoUploadSchema.parse(input);
  requireSource(payload);
  if (payload.bytes) {
    return listAccountEdge("advideos", {
      file_url: `data:application/octet-stream;base64,${payload.bytes.toString("base64")}`,
      title: payload.title || payload.name || "creative-video",
      description: payload.description,
    });
  }
  return listAccountEdge("advideos", {
    file_url: payload.url!,
    title: payload.title || payload.name || "creative-video",
    description: payload.description,
  });
}

