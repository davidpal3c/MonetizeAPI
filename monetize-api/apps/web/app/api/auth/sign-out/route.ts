import { AGNIC_OAUTH_STATE_COOKIE } from "@monetize-api/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  PENDING_INPUT_COOKIE,
  TOKEN_COOKIE,
} from "../../../../lib/agnic-cookies";

export const dynamic = "force-dynamic";

function clearCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const secure = origin.startsWith("https:");
  const options = clearCookieOptions(secure);

  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(TOKEN_COOKIE, "", options);
  response.cookies.set(PENDING_INPUT_COOKIE, "", options);
  response.cookies.set(AGNIC_OAUTH_STATE_COOKIE, "", options);

  return response;
}
