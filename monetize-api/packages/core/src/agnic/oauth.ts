import { randomUUID } from "node:crypto";

/** Official authorize host per https://docs.agnic.ai/docs/authentication/oauth2 */
const AGNIC_AUTHORIZE_URL = "https://api.agnic.ai/oauth/authorize";
const AGNIC_TOKEN_URL = "https://api.agnic.ai/oauth/token";

/** Default scopes for OAuth consent (model + balance). Override with AGNIC_OAUTH_SCOPES. */
const DEFAULT_SCOPES = "payments:sign balance:read api:call";

export const AGNIC_OAUTH_STATE_COOKIE = "agnic_oauth_state";

/** Max age (seconds) for the OAuth state cookie stored before authorize redirect. */
export const AGNIC_OAUTH_STATE_MAX_AGE = 600;

export function generateAgnicOAuthState(): string {
  return randomUUID();
}

export function resolveAgnicOAuthScopes(): string {
  return process.env.AGNIC_OAUTH_SCOPES?.trim() || DEFAULT_SCOPES;
}

export function buildAgnicAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: string;
}): string {
  const search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: params.scopes ?? resolveAgnicOAuthScopes(),
    state: params.state,
  });

  return `${AGNIC_AUTHORIZE_URL}?${search.toString()}`;
}

export type AgnicTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export async function exchangeAgnicAuthorizationCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<AgnicTokenResponse> {
  const response = await fetch(AGNIC_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
    }),
  });

  const body = (await response.json()) as AgnicTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const detail = body.error_description ?? body.error ?? response.statusText;
    throw new Error(`Agnic token exchange failed: ${detail}`);
  }

  if (!body.access_token) {
    throw new Error("Agnic token exchange did not return access_token.");
  }

  return body;
}

export function resolveCallbackRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}
