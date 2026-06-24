import { renderPage } from "@/lib/blocks/render-page";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  return renderPage({ slugPath: "notifications" });
}
