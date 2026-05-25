import { NextResponse } from "next/server";

import {
  PENDING_INPUT_COOKIE,
  PENDING_INPUT_MAX_AGE,
} from "../../../../lib/agnic-cookies";

export const dynamic = "force-dynamic";

const MAX_INPUT_BYTES = 16_000;

export async function POST(request: Request) {
  let input = "";
  try {
    const body = (await request.json()) as { input?: string };
    input = typeof body.input === "string" ? body.input : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (Buffer.byteLength(input, "utf8") > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: "input_too_large" }, { status: 413 });
  }

  const response = NextResponse.json({ ok: true });
  const secure = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";

  response.cookies.set(PENDING_INPUT_COOKIE, encodeURIComponent(input), {
    httpOnly: true,
    secure: secure || new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_INPUT_MAX_AGE,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PENDING_INPUT_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
