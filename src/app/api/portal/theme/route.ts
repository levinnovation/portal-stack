import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { THEME_COOKIE, normalizeThemePreference, type ThemePreference } from "@/lib/theme/preference";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let themePreference: ThemePreference;
  try {
    const body = await req.json();
    themePreference = normalizeThemePreference(body?.themePreference);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const payload = await getPayloadClient();
  await payload.update({
    collection: "users",
    id: user.id,
    data: { themePreference },
    overrideAccess: true,
  });

  const res = NextResponse.json({ ok: true, themePreference });
  res.cookies.set(THEME_COOKIE, themePreference, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
