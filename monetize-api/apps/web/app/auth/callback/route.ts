import {
  exchangeAgnicAuthorizationCode,
  resolveCallbackRedirectUri,
} from "@monetize-api/core";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "agnic_access_token";

export async function GET(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_AGNIC_CLIENT_ID?.trim();
  const clientSecret = process.env.AGNIC_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return new Response("Missing Agnic OAuth client configuration", {
      status: 500,
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`Agnic OAuth error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const redirectUri = resolveCallbackRedirectUri(url.origin);

  try {
    const token = await exchangeAgnicAuthorizationCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    const response = NextResponse.redirect(new URL("/", url.origin));
    response.cookies.set(TOKEN_COOKIE, token.access_token, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in ?? 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return new Response(message, { status: 502 });
  }
}
