const AGNIC_BALANCE_URL = "https://api.agnic.ai/api/balance";

export type AgnicBalance = {
  /** Combined USDC + credit (maps to Agnic `totalBalance`). */
  balance: number;
  currency: string;
  totalBalance: number;
  creditBalance?: number;
  usdcBalance?: number;
};

export type FetchAgnicBalanceOptions = {
  /** Sent when configured (partner-attributed apps). */
  partnerId?: string;
};

type AgnicBalanceApiResponse = {
  usdcBalance?: string;
  creditBalance?: string;
  totalBalance?: string;
  balance?: number | string;
  currency?: string;
  data?: { balance?: number | string; currency?: string };
  error?: string | { message?: string };
  error_description?: string;
  message?: string;
};

function parseBalanceValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function extractBalance(body: AgnicBalanceApiResponse): number | undefined {
  return (
    parseBalanceValue(body.totalBalance) ??
    parseBalanceValue(body.creditBalance) ??
    parseBalanceValue(body.balance) ??
    parseBalanceValue(body.data?.balance)
  );
}

function extractErrorMessage(body: AgnicBalanceApiResponse, status: number): string {
  if (body.error_description) {
    return body.error_description;
  }
  if (body.message) {
    return body.message;
  }
  if (typeof body.error === "string") {
    return body.error;
  }
  if (body.error?.message) {
    return body.error.message;
  }
  return `Agnic balance request failed with HTTP ${status}`;
}

export async function fetchAgnicBalance(
  accessToken: string,
  options: FetchAgnicBalanceOptions = {},
): Promise<AgnicBalance> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken.trim()}`,
  };

  const partnerId = options.partnerId?.trim();
  if (partnerId) {
    headers["X-Partner-Id"] = partnerId;
  }

  const response = await fetch(AGNIC_BALANCE_URL, {
    headers,
    cache: "no-store",
  });

  const body = (await response.json()) as AgnicBalanceApiResponse;

  if (!response.ok) {
    const message = extractErrorMessage(body, response.status);
    const error = new Error(message) as Error & { httpStatus?: number };
    error.httpStatus = response.status;
    throw error;
  }

  const total = extractBalance(body);
  if (total === undefined) {
    throw new Error(
      "Agnic balance response did not include totalBalance, creditBalance, or balance.",
    );
  }

  const creditBalance = parseBalanceValue(body.creditBalance);
  const usdcBalance = parseBalanceValue(body.usdcBalance);

  return {
    balance: total,
    totalBalance: total,
    currency: body.currency ?? body.data?.currency ?? "USD",
    creditBalance,
    usdcBalance,
  };
}
