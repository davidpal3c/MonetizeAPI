import {
  AGNIC_DEMO_PROOF_PROMPT,
  buildAgnicConfigFromAccessToken,
  callAgnicChatCompletion,
} from "@monetize-api/core";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

const TOKEN_COOKIE = "agnic_access_token";

function preview(text: string, max = 400): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export default async function AgnicProofPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return (
      <main>
        <h1>Agnic model proof</h1>
        <p>Sign in with Agnic first so your access token is available.</p>
        <p>
          <a href="/api/auth/sign-in">Sign in with Agnic</a>
        </p>
        <p>
          <a href="/">Back to home</a>
        </p>
      </main>
    );
  }

  const credentialCheck = buildAgnicConfigFromAccessToken(accessToken);

  if (!credentialCheck.ready || !credentialCheck.config) {
    return (
      <main>
        <h1>Agnic model proof</h1>
        <p role="alert" style={{ color: "#b71c1c" }}>
          Missing configuration: {credentialCheck.missing.join(", ")}
        </p>
        <p>
          Set <code>AGNIC_PARTNER_ID</code> in <code>apps/web/.env.local</code> on
          the server.
        </p>
        <p>
          <a href="/">Back to home</a>
        </p>
      </main>
    );
  }

  const config = credentialCheck.config;

  try {
    const result = await callAgnicChatCompletion(config, AGNIC_DEMO_PROOF_PROMPT);

    return (
      <main>
        <h1>Agnic model proof</h1>
        <p style={{ color: "#1b5e20", fontWeight: 600 }}>Success</p>
        <p>
          Live model call completed with <code>X-Partner-Id</code> and your OAuth
          access token (httpOnly cookie).
        </p>
        <dl style={{ fontSize: "0.9rem" }}>
          <dt>Model</dt>
          <dd>{result.model}</dd>
          <dt>Reply</dt>
          <dd>{preview(result.content)}</dd>
          {result.usage?.total_tokens != null ? (
            <>
              <dt>Tokens</dt>
              <dd>{result.usage.total_tokens}</dd>
            </>
          ) : null}
        </dl>
        <p>
          <a href="/">Back to home</a>
        </p>
      </main>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Agnic error";
    const httpStatus =
      err instanceof Error && "httpStatus" in err
        ? (err as Error & { httpStatus?: number }).httpStatus
        : undefined;

    return (
      <main>
        <h1>Agnic model proof</h1>
        <p role="alert" style={{ color: "#b71c1c", fontWeight: 600 }}>
          Error{httpStatus != null ? ` (HTTP ${httpStatus})` : ""}
        </p>
        <p>{message}</p>
        <p>
          <a href="/">Back to home</a>
        </p>
      </main>
    );
  }
}
