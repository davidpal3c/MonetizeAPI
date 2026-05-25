import { resolveAgnicOAuthScopes } from "./oauth.js";

const AGNIC_API_ORIGIN = "https://api.agnic.ai";

/** Candidate paths checked during live report — not documented for current OAuth scopes. */
export const AGNIC_SPEND_PROBE_PATHS = [
  "/api/transactions",
  "/api/usage",
  "/api/payments",
  "/api/spend",
] as const;

export type AgnicSpendProbeAttempt = {
  path: string;
  httpStatus: number | "network_error";
};

export type AgnicSpendVerificationProbe = {
  /** True only when a probe returns 2xx with a non-empty spend/transaction payload. */
  spendApiAvailable: boolean;
  oauthScopes: string;
  attempts: AgnicSpendProbeAttempt[];
  summary: string;
};

type ProbeFetchOptions = {
  accessToken: string;
  partnerId?: string;
  signal?: AbortSignal;
};

async function probePath(
  path: string,
  options: ProbeFetchOptions,
): Promise<{ attempt: AgnicSpendProbeAttempt; spendApiAvailable: boolean }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.accessToken.trim()}`,
  };
  const partnerId = options.partnerId?.trim();
  if (partnerId) {
    headers["X-Partner-Id"] = partnerId;
  }

  try {
    const response = await fetch(`${AGNIC_API_ORIGIN}${path}`, {
      headers,
      cache: "no-store",
      signal: options.signal,
    });

    let spendApiAvailable = false;
    if (response.ok) {
      try {
        const body = (await response.json()) as unknown;
        spendApiAvailable = looksLikeSpendPayload(body);
      } catch {
        spendApiAvailable = false;
      }
    }

    return {
      attempt: { path, httpStatus: response.status },
      spendApiAvailable,
    };
  } catch {
    return {
      attempt: { path, httpStatus: "network_error" },
      spendApiAvailable: false,
    };
  }
}

function looksLikeSpendPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }

  const record = body as Record<string, unknown>;
  const collections = [record.items, record.transactions, record.data, record.history];
  for (const value of collections) {
    if (Array.isArray(value) && value.length > 0) {
      return true;
    }
  }

  if (typeof record.amount === "number" || typeof record.costUsd === "number") {
    return true;
  }

  return false;
}

function summarizeProbe(
  attempts: AgnicSpendProbeAttempt[],
  spendApiAvailable: boolean,
  scopes: string,
): string {
  if (spendApiAvailable) {
    return "Agnic returned spend/transaction data for at least one probed endpoint.";
  }

  const statuses = attempts
    .map((a) => (a.httpStatus === "network_error" ? "err" : String(a.httpStatus)))
    .join(", ");

  return (
    `No Agnic spend/transaction API exposed usable line items with OAuth scopes ` +
    `"${scopes}" (probed: ${statuses}). Per-call debits may not appear immediately on balance.`
  );
}

export async function probeAgnicSpendVerification(
  accessToken: string,
  options: { partnerId?: string } = {},
): Promise<AgnicSpendVerificationProbe> {
  const oauthScopes = resolveAgnicOAuthScopes();
  const attempts: AgnicSpendProbeAttempt[] = [];
  let spendApiAvailable = false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    for (const path of AGNIC_SPEND_PROBE_PATHS) {
      const result = await probePath(path, {
        accessToken,
        partnerId: options.partnerId,
        signal: controller.signal,
      });
      attempts.push(result.attempt);
      if (result.spendApiAvailable) {
        spendApiAvailable = true;
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return {
    spendApiAvailable,
    oauthScopes,
    attempts,
    summary: summarizeProbe(attempts, spendApiAvailable, oauthScopes),
  };
}
