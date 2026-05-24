"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PaidReportGenerationResult, ReportPackage } from "../../lib/agnic-client";
import { serializeReportPackageClient } from "../../lib/agnic-client";

import { AddFundsButton } from "./AddFundsButton";

type ReportFlowProps = {
  defaultInput: string;
  initialInput?: string;
  initialSignedIn: boolean;
  authError?: string;
  authErrorDetail?: string;
};

type SessionResponse = {
  signedIn: boolean;
  clientId: string | null;
  partnerConfigured: boolean;
};

type BalanceResponse = {
  balance: number;
  currency?: string;
};

export function ReportFlow({
  defaultInput,
  initialInput = "",
  initialSignedIn,
  authError,
  authErrorDetail,
}: ReportFlowProps) {
  const [input, setInput] = useState(initialInput || defaultInput);
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [clientId, setClientId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
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

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/agnic/session", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as SessionResponse;
    setSignedIn(data.signedIn);
    setClientId(data.clientId);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!signedIn) {
      setBalance(null);
      return;
    }

    setLoadingBalance(true);
    try {
      const response = await fetch("/api/agnic/balance", { cache: "no-store" });
      if (!response.ok) {
        setBalance(null);
        return;
      }
      const data = (await response.json()) as BalanceResponse;
      setBalance(data.balance);
      setCurrency(data.currency ?? "USD");
    } finally {
      setLoadingBalance(false);
    }
  }, [signedIn]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance, signedIn]);

  useEffect(() => {
    if (restoredFromOAuth) {
      void fetch("/api/auth/preserve-input", { method: "DELETE" });
    }
  }, [restoredFromOAuth]);

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
              "We could not confidently parse this endpoint. Use the fixture demo instead?",
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

    const blob = new Blob([serializeReportPackageClient(reportResult.package as ReportPackage)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `monetizeapi-report-${reportResult.package.reportId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{ marginTop: "1.5rem" }}>
      {authError ? (
        <AuthErrorAlert title={`Sign-in failed (${authError})`} detail={authErrorDetail} />
      ) : null}

      <p style={{ fontSize: "0.95rem", color: "#333" }}>
        New Agnic users start with <strong>$5 starter credit</strong> — try your first paid
        report with no setup risk.
      </p>

      <label htmlFor="endpoint-input" style={{ display: "block", fontWeight: 600 }}>
        Endpoint / API input
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
          Sign in with Agnic when you are ready to generate a paid live report.
        </p>
      ) : (
        <SignedInStatus
          balance={balance}
          currency={currency}
          loadingBalance={loadingBalance}
          restoredFromOAuth={restoredFromOAuth}
        />
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="button"
          onClick={() => void generateReport("live")}
          disabled={generating}
          style={primaryButtonStyle}
        >
          {generating ? "Generating…" : signedIn ? "Generate Report (paid)" : "Sign in & Generate Report"}
        </button>
        <button
          type="button"
          onClick={() => void generateReport("fixture")}
          disabled={generating}
          style={secondaryButtonStyle}
        >
          Generate demo report (fixture)
        </button>
        {parseFailed ? (
          <button
            type="button"
            onClick={() => void generateReport("fixture", { useCanonicalFixture: true })}
            disabled={generating}
            style={secondaryButtonStyle}
          >
            Use canonical fixture demo
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
          <h2 style={{ marginTop: 0 }}>Report package ready</h2>
          <p>
            Mode: <strong>{reportResult.package.mode}</strong>
            {reportResult.parseSource === "fixture_fallback"
              ? " (canonical company-risk-score fixture)"
              : null}
          </p>
          <p style={{ fontSize: "0.875rem", color: "#444" }}>
            Report ID: {reportResult.package.reportId}
          </p>
          {reportResult.package.files["monetization-report.json"] ? (
            <p style={{ fontSize: "0.875rem", color: "#444" }}>
              Endpoint:{" "}
              {(() => {
                try {
                  const parsed = JSON.parse(
                    reportResult.package.files["monetization-report.json"],
                  ) as { endpoint?: { method?: string; path?: string } };
                  return parsed.endpoint
                    ? `${parsed.endpoint.method} ${parsed.endpoint.path}`
                    : "—";
                } catch {
                  return "—";
                }
              })()}
            </p>
          ) : null}
          {reportResult.package.modelInsight ? (
            <p style={{ fontSize: "0.9rem" }}>
              <strong>Model insight:</strong> {reportResult.package.modelInsight}
            </p>
          ) : null}
          {reportResult.package.usage?.total_tokens != null ? (
            <p style={{ fontSize: "0.875rem", color: "#444" }}>
              Tokens used: {reportResult.package.usage.total_tokens}
            </p>
          ) : null}
          <p style={{ fontSize: "0.875rem", color: "#444" }}>
            Files: {Object.keys(reportResult.package.files).join(", ")}
          </p>
          <button type="button" onClick={downloadPackage} style={downloadButtonStyle}>
            Download report package
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
  currency,
  loadingBalance,
  restoredFromOAuth,
}: {
  balance: number | null;
  currency: string;
  loadingBalance: boolean;
  restoredFromOAuth: boolean;
}) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ color: "#1b5e20", fontWeight: 600 }}>
        Signed in with Agnic
        {restoredFromOAuth ? " — your input was restored after OAuth." : null}
      </p>
      <p>
        Balance:{" "}
        {loadingBalance
          ? "Loading…"
          : balance != null
            ? `$${balance.toFixed(2)} ${currency}`
            : "Unavailable"}
      </p>
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
