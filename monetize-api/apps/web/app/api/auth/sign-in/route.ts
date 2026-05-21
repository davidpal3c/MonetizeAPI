import {
  buildAgnicAuthorizeUrl,
  resolveCallbackRedirectUri,
} from "@monetize-api/core";

export function GET(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_AGNIC_CLIENT_ID?.trim();
  if (!clientId) {
    return new Response("Missing NEXT_PUBLIC_AGNIC_CLIENT_ID", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = resolveCallbackRedirectUri(origin);
  const authorizeUrl = buildAgnicAuthorizeUrl({ clientId, redirectUri });

  return Response.redirect(authorizeUrl);
}
