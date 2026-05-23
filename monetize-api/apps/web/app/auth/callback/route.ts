import {
  AGNIC_OAUTH_STATE_COOKIE,
  exchangeAgnicAuthorizationCode,
  resolveCallbackRedirectUri,
} from "@monetize-api/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN_COOKIE = "agnic_access_token";

function redirectWithError(origin: string, code: string, detail: string): NextResponse {
  const home = new URL("/", origin);
  home.searchParams.set("auth_error", code);
  home.searchParams.set("auth_error_detail", detail);
  return NextResponse.redirect(home);
}

export async function GET(request: Request) {
  const clientId = process.env.AGNIC_CLIENT_ID?.trim();
  const clientSecret = process.env.AGNIC_CLIENT_SECRET?.trim();

  const url = new URL(request.url);
  const origin = url.origin;

  if (!clientId || !clientSecret) {
    return redirectWithError(
      origin,
      "config",
      "Missing Agnic OAuth client configuration.",
    );
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const stateParam = url.searchParams.get("state");

  if (error) {
    const detail = errorDescription
      ? `${error}: ${errorDescription}`
      : error;
    return redirectWithError(origin, "agnic", detail);
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(AGNIC_OAUTH_STATE_COOKIE)?.value;

  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return redirectWithError(
      origin,
      "state",
      "Invalid or missing OAuth state. Sign in again using the same host (localhost or 127.0.0.1).",
    );
  }

  if (!code) {
    return redirectWithError(
      origin,
      "code",
      "Missing authorization code from Agnic.",
    );
  }

  const redirectUri = resolveCallbackRedirectUri(origin);

  try {
    const token = await exchangeAgnicAuthorizationCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(TOKEN_COOKIE, token.access_token, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in ?? 60 * 60 * 24 * 7,
    });
    response.cookies.set(AGNIC_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return redirectWithError(origin, "token", message);
  }
}
