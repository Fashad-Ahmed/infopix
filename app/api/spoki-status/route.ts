import { NextResponse } from "next/server";

/** Lightweight env-check called by the /whatsapp admin page. Never expose secret values. */
export function GET(): NextResponse {
  return NextResponse.json({
    SPOKI_API_KEY: Boolean(process.env.SPOKI_API_KEY),
    SPOKI_WEBHOOK_SECRET: Boolean(process.env.SPOKI_WEBHOOK_SECRET),
    SPOKI_BOT_PHONE: process.env.SPOKI_BOT_PHONE ?? null,
  });
}
