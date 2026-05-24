"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildReportZipBlob } from "../../lib/build-report-zip";
import type { PaidReportGenerationResult } from "../../lib/agnic-client";

import { AddFundsButton } from "./AddFundsButton";

type ReportFlowProps = {
  defaultInput: string;
  initialInput?: string;
  initialSignedIn: boolean;
  initialBalance?: number | null;
  initialBalanceError?: string | null;
  initialCurrency?: string;
  authError?: string;
  authErrorDetail?: string;
};

type SessionResponse = {
  signedIn: boolean;
  clientId: string | null;
  partnerConfigured: boolean;
  topupReturnUrl: string;
};

type BalanceResponse = {
  balance: number;
  currency?: string;
  error?: string;
};

export function ReportFlow({
  defaultInput,
  initialInput = "",
  initialSignedIn,
  initialBalance = null,
  initialBalanceError = null,
  initialCurrency = "USD",
  authError,
  authErrorDetail,
}: ReportFlowProps) {
  const [input, setInput] = useState(initialInput || defaultInput);
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [clientId, setClientId] = useState<string | null>(null);
  const [topupReturnUrl, setTopupReturnUrl] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(initialBalance);
  const [balanceError, setBalanceError] = useState<string | null>(initialBalanceError);
  const [currency, setCurrency] = useState(initialCurrency);
  const [topupMessage, setTopupMessage] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFunds, setNeedsFunds] = useState(false);
  const [reportResult, setReportResult] = useState<PaidReportGenerationResult | null>(null);
  const [parseFailed, setParseFailed] = useState(false);

  const restoredFromOAuth = useMemo(
    () => Boolean(initialInput && initialSignedIn),
    [initialInput, initialSignedIn],
  );

  const fetchBalance = useCallback(async () => {
    const response = await fetch("/api/agnic/balance", {
      cache: "no-store",
      credentials: "include",
    });
    const data = (await response.json()) as BalanceResponse;
    if (!response.ok) {
      setBalance(null);
      setBalanceError(data.error ?? "Unable to load balance");
      return;
    }
    setBalance(data.balance);
    setCurrency(data.currency ?? "USD");
    setBalanceError(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      await fetchBalance();
    } catch {
      setBalance(null);
      setBalanceError("Unable to load balance");
    } finally {
      setLoadingBalance(false);
    }
  }, [fetchBalance]);

  const loadAuthState = useCallback(async () => {
    const hasInitialBalance = initialSignedIn && initialBalance != null && !initialBalanceError;
    if (!hasInitialBalance) {
      setLoadingBalance(true);
    }

    try {
      const sessionResponse = await fetch("/api/agnic/session", {
        cache: "no-store",
        credentials: "include",
      });

      if (!sessionResponse.ok) {
        setSignedIn(false);
        setClientId(null);
        setTopupReturnUrl(null);
        setBalance(null);
        setBalanceError("Unable to verify Agnic session");
        return;
      }

      const session = (await sessionResponse.json()) as SessionResponse;
      setSignedIn(session.signedIn);
      setClientId(session.clientId);
      setTopupReturnUrl(session.topupReturnUrl ?? null);

      if (!session.signedIn) {
        setBalance(null);
        setBalanceError(null);
        return;
      }

      await fetchBalance();
    } catch {
      setBalance(null);
      setBalanceError("Unable to load balance");
    } finally {
      if (!hasInitialBalance) {
        setLoadingBalance(false);
      }
    }
  }, [fetchBalance, initialSignedIn, initialBalance, initialBalanceError]);

  useEffect(() => {
    void loadAuthState();
  }, [loadAuthState]);

  useEffect(() => {
    if (restoredFromOAuth) {
      void fetch("/api/auth/preserve-input", { method: "DELETE" });
    }
  }, [restoredFromOAuth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const topup = params.get("topup");
    if (topup !== "success" && topup !== "cancelled") {
      return;
    }

    if (topup === "success") {
      setTopupMessage("Funds added — your balance has been updated.");
      void refreshBalance();
    }

    params.delete("topup");
    params.delete("session_id");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : ""),
    );
  }, [refreshBalance]);

  const signInForReport = async () => {
    setError(null);
    await fetch("/api/auth/preserve-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    window.location.href = "/api/auth/sign-in";
  };

  const generateReport = async (
    mode: "live" | "fixture",
    options: { useCanonicalFixture?: boolean } = {},
  ) => {
    setError(null);
    setNeedsFunds(false);
    setParseFailed(false);
    setGenerating(true);
    setReportResult(null);

    try {
      if (mode === "live" && !signedIn) {
        await signInForReport();
        return;
      }

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          mode,
          useCanonicalFixture: options.useCanonicalFixture === true,
        }),
      });

      const data = (await response.json()) as PaidReportGenerationResult & {
        error?: string;
        needsFunds?: boolean;
        message?: string;
        parseFailed?: boolean;
      };

      if (!response.ok) {
        if (data.parseFailed || data.error === "parse_failed") {
          setParseFailed(true);
          setError(
            data.message ??
              "We couldn't interpret that description. Try the sample demo or add a bit more detail.",
          );
          return;
        }
        setError(data.message ?? data.error ?? "Report generation failed.");
        setNeedsFunds(Boolean(data.needsFunds));
        return;
      }

      setReportResult(data);
      if (mode === "live") {
        await refreshBalance();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPackage = () => {
    if (!reportResult?.package) {
      return;
    }

    const blob = buildReportZipBlob(reportResult.package.files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `monetizeapi-launch-package-${reportResult.package.reportId}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{ marginTop: "1.5rem" }}>
      {authError ? (
        <AuthErrorAlert
          title="We couldn't complete sign-in"
          detail={authErrorDetail ?? authError}
        />
      ) : null}

      <p style={{ fontSize: "0.95rem", color: "#333" }}>
        Describe your API in plain language or paste a structured spec. New Agnic accounts
        include <strong>$5 starter credit</strong> for your first live report.
      </p>

      <label htmlFor="endpoint-input" style={{ display: "block", fontWeight: 600 }}>
        Your API or endpoint
      </label>
      <textarea
        id="endpoint-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={10}
        style={{
          width: "100%",
          maxWidth: "48rem",
          marginTop: "0.5rem",
          fontFamily: "monospace",
          fontSize: "0.875rem",
        }}
      />

      {!signedIn ? (
        <p style={{ marginTop: "1rem" }}>
          Sign in with Agnic to generate a live, paid monetization report.
        </p>
      ) : (
        <SignedInStatus
          balance={balance}
          balanceError={balanceError}
          currency={currency}
          loadingBalance={loadingBalance}
          inputRestored={restoredFromOAuth}
          topupMessage={topupMessage}
        />
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="button"
          onClick={() => void generateReport("live")}
          disabled={generating}
          style={primaryButtonStyle}
        >
          {generating ? "Generating…" : signedIn ? "Generate live report" : "Sign in & generate report"}
        </button>
        <button
          type="button"
          onClick={() => void generateReport("fixture")}
          disabled={generating}
          style={secondaryButtonStyle}
        >
          Try sample report (free)
        </button>
        {parseFailed ? (
          <button
            type="button"
            onClick={() => void generateReport("fixture", { useCanonicalFixture: true })}
            disabled={generating}
            style={secondaryButtonStyle}
          >
            Use sample company-risk API
          </button>
        ) : null}
        {!signedIn ? (
          <button
            type="button"
            onClick={() => void signInForReport()}
            disabled={generating}
            style={secondaryButtonStyle}
          >
            Sign in with Agnic
          </button>
        ) : null}
        {signedIn ? (
          <AddFundsButton
            clientId={clientId}
            topupReturnUrl={topupReturnUrl}
            balance={balance}
            currency={currency}
            onBalanceRefresh={() => void refreshBalance()}
            disabled={!clientId}
          />
        ) : null}
      </div>

      {error ? (
        <p role="alert" style={{ color: "#b71c1c", marginTop: "1rem" }}>
          {error}
          {needsFunds ? " Use Add Funds to top up your Agnic balance." : null}
        </p>
      ) : null}

      {reportResult?.package ? (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Your launch package is ready</h2>
          <p>
            {reportResult.package.mode === "live" ? (
              <>
                <strong>Live report</strong> — generated with your Agnic balance.
              </>
            ) : (
              <>
                <strong>Sample report</strong>
                {reportResult.parseSource === "fixture_fallback"
                  ? " — built from our company-risk example."
                  : " — no Agnic charge."}
              </>
            )}
          </p>
          {reportResult.package.files["monetization-report.json"] ? (
            <p style={{ fontSize: "0.875rem", color: "#444" }}>
              {(() => {
                try {
                  const parsed = JSON.parse(
                    reportResult.package.files["monetization-report.json"],
                  ) as {
                    endpoint?: { method?: string; path?: string };
                  };
                  const endpointLabel = parsed.endpoint
                    ? `${parsed.endpoint.method} ${parsed.endpoint.path}`
                    : null;
                  return endpointLabel ? `Endpoint: ${endpointLabel}` : null;
                } catch {
                  return null;
                }
              })()}
            </p>
          ) : null}
          {reportResult.package.modelInsight ? (
            <p style={{ fontSize: "0.9rem" }}>
              <strong>Highlights:</strong> {reportResult.package.modelInsight}
            </p>
          ) : null}
          <button type="button" onClick={downloadPackage} style={downloadButtonStyle}>
            Download launch package (.zip)
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AuthErrorAlert({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: "1rem",
        padding: "0.75rem 1rem",
        border: "1px solid #c62828",
        borderRadius: "6px",
        background: "#ffebee",
        color: "#b71c1c",
      }}
    >
      <strong>{title}</strong>
      {detail ? <p style={{ margin: "0.5rem 0 0" }}>{detail}</p> : null}
    </div>
  );
}

function SignedInStatus({
  balance,
  balanceError,
  currency,
  loadingBalance,
  inputRestored,
  topupMessage,
}: {
  balance: number | null;
  balanceError: string | null;
  currency: string;
  loadingBalance: boolean;
  inputRestored: boolean;
  topupMessage: string | null;
}) {
  let balanceLabel: string;
  if (loadingBalance) {
    balanceLabel = "Loading…";
  } else if (balance != null) {
    balanceLabel = `$${balance.toFixed(2)} ${currency}`;
  } else if (balanceError) {
    balanceLabel = `Unable to load balance (${balanceError})`;
  } else {
    balanceLabel = "Unable to load balance";
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ color: "#1b5e20", fontWeight: 600 }}>
        Signed in with Agnic
        {inputRestored ? " — we kept your API description." : null}
      </p>
      <p>Balance: {balanceLabel}</p>
      {topupMessage ? (
        <p style={{ color: "#1b5e20", fontSize: "0.9rem" }}>{topupMessage}</p>
      ) : null}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "1px solid #1565c0",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "1px solid #757575",
  background: "#fff",
  color: "#333",
  cursor: "pointer",
};

const downloadButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "1px solid #2e7d32",
  background: "#388e3c",
  color: "#fff",
  cursor: "pointer",
};
