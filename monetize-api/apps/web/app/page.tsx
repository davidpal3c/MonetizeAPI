import { fetchAgnicBalance, getDefaultCompanyRiskScoreInput } from "@monetize-api/core";
import { cookies } from "next/headers";

import { ReportFlow } from "./components/ReportFlow";
import { PENDING_INPUT_COOKIE, TOKEN_COOKIE } from "../lib/agnic-cookies";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    auth_error?: string;
    auth_error_detail?: string;
  }>;
};

function decodePendingInput(value: string | undefined): string {
  if (!value) {
    return "";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value?.trim();
  const hasToken = Boolean(accessToken);
  const pendingInput = decodePendingInput(cookieStore.get(PENDING_INPUT_COOKIE)?.value);
  const defaultInput = getDefaultCompanyRiskScoreInput();

  let initialBalance: number | null = null;
  let initialBalanceError: string | null = null;
  let initialCurrency = "USD";

  if (accessToken) {
    try {
      const balance = await fetchAgnicBalance(accessToken, {
        partnerId: process.env.AGNIC_PARTNER_ID?.trim() || undefined,
      });
      initialBalance = balance.balance;
      initialCurrency = balance.currency;
    } catch (err) {
      initialBalanceError =
        err instanceof Error ? err.message : "Unable to load Agnic balance";
    }
  }

  return (
    <main style={{ maxWidth: "52rem", margin: "0 auto", padding: "1.5rem" }}>
      <h1>MonetizeAPI</h1>
      <p>From endpoint to paid agent-ready tool.</p>

      <ReportFlow
        defaultInput={defaultInput}
        initialInput={pendingInput}
        initialSignedIn={hasToken}
        initialBalance={initialBalance}
        initialBalanceError={initialBalanceError}
        initialCurrency={initialCurrency}
        authError={params.auth_error}
        authErrorDetail={params.auth_error_detail}
      />

      <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#444" }}>
        <a href="/agnic/proof">Agnic model proof</a> (engineering smoke test)
      </p>

      <p style={{ fontSize: "0.875rem", color: "#444" }}>
        Register OAuth redirect URIs on your Agnic client (e.g.{" "}
        <code>http://localhost:3000/auth/callback</code> locally,{" "}
        <code>https://monetizeapi.onrender.com/auth/callback</code> in production).
        Add Funds uses the same callback URL as top-up <code>return_url</code>.
      </p>
    </main>
  );
}
