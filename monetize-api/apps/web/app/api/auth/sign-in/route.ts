import {
  AGNIC_OAUTH_STATE_COOKIE,
  AGNIC_OAUTH_STATE_MAX_AGE,
  buildAgnicAuthorizeUrl,
  generateAgnicOAuthState,
  resolveCallbackRedirectUri,
} from "@monetize-api/core";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_AGNIC_CLIENT_ID?.trim();
  if (!clientId) {
    return new Response("Missing NEXT_PUBLIC_AGNIC_CLIENT_ID", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = resolveCallbackRedirectUri(origin);
  const state = generateAgnicOAuthState();
  const authorizeUrl = buildAgnicAuthorizeUrl({ clientId, redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(AGNIC_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: AGNIC_OAUTH_STATE_MAX_AGE,
  });

  return response;
}
