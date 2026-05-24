const AGNIC_BALANCE_URL = "https://api.agnic.ai/api/balance";

export type AgnicBalance = {
  balance: number;
  currency?: string;
};

type BalanceResponse = {
  balance?: number;
  currency?: string;
  error?: { message?: string };
};

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

  if (typeof body.balance !== "number") {
    throw new Error("Agnic balance response did not include a numeric balance.");
  }

  return {
    balance: body.balance,
    currency: body.currency ?? "USD",
  };
}
