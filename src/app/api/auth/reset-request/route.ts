import { NextResponse } from "next/server";

/** ponytail: logs reset request — wire Resend when email flow is production-ready. */
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  console.log(`[auth] password reset requested for ${email}`);
  return NextResponse.json({ ok: true, message: "If the account exists, reset instructions were sent." });
}
