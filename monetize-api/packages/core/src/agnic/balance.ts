const AGNIC_BALANCE_URL = "https://api.agnic.ai/api/balance";

export type AgnicBalance = {
  balance: number;
  currency?: string;
};

type BalanceResponse = {
  balance?: number | string;
  currency?: string;
  data?: { balance?: number | string; currency?: string };
  error?: { message?: string };
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

function extractBalance(body: BalanceResponse): number | undefined {
  return (
    parseBalanceValue(body.balance) ??
    parseBalanceValue(body.data?.balance)
  );
}

export async function fetchAgnicBalance(accessToken: string): Promise<AgnicBalance> {
  const response = await fetch(AGNIC_BALANCE_URL, {
    headers: { Authorization: `Bearer ${accessToken.trim()}` },
    cache: "no-store",
  });

  const body = (await response.json()) as BalanceResponse;

  if (!response.ok) {
    const message =
      body.error?.message ?? `Agnic balance request failed with HTTP ${response.status}`;
    const error = new Error(message) as Error & { httpStatus?: number };
    error.httpStatus = response.status;
    throw error;
  }

  const balance = extractBalance(body);
  if (balance === undefined) {
    throw new Error("Agnic balance response did not include a numeric balance.");
  }

  return {
    balance,
    currency: body.currency ?? body.data?.currency ?? "USD",
  };
}
