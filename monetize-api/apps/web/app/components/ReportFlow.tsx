"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildReportZipBlob } from "../../lib/build-report-zip";
import {
  formatMonetizeApiReportGenerationFee,
  MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD,
} from "../../lib/report-generation-cost";
import type { LivePaymentProof, PaidReportGenerationResult } from "../../lib/agnic-client";

import { AppHeader } from "./AppHeader";
import { EndpointInputComposer } from "./EndpointInputComposer";
import { InputFormatGuide } from "./InputFormatGuide";

type ReportFlowProps = {
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
  initialInput = "",
  initialSignedIn,
  initialBalance = null,
  initialBalanceError = null,
  initialCurrency = "USD",
  authError,
  authErrorDetail,
}: ReportFlowProps) {
  const [input, setInput] = useState(initialInput);
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
  const [balanceRefreshWarning, setBalanceRefreshWarning] = useState<string | null>(
    null,
  );
  const launchPackageRef = useRef<HTMLDivElement>(null);

  const restoredFromOAuth = useMemo(
    () => Boolean(initialInput && initialSignedIn),
    [initialInput, initialSignedIn],
  );

  const fetchBalance = useCallback(async (): Promise<boolean> => {
    const response = await fetch("/api/agnic/balance", {
      cache: "no-store",
      credentials: "include",
    });
    const data = (await response.json()) as BalanceResponse;
    if (!response.ok) {
      setBalance(null);
      setBalanceError(data.error ?? "Unable to load balance");
      return false;
    }
    setBalance(data.balance);
    setCurrency(data.currency ?? "USD");
    setBalanceError(null);
    return true;
  }, []);

  const refreshBalance = useCallback(async () => {
    setLoadingBalance(true);
    setBalanceRefreshWarning(null);
    try {
      await fetchBalance();
    } catch {
      setBalance(null);
      setBalanceError("Unable to load balance");
    } finally {
      setLoadingBalance(false);
    }
  }, [fetchBalance]);

  const refreshBalanceAfterReport = useCallback(async () => {
    setLoadingBalance(true);
    setBalanceRefreshWarning(null);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      let ok = await fetchBalance();
      if (!ok) {
        await delay(1500);
        ok = await fetchBalance();
      } else {
        await delay(1200);
        await fetchBalance();
      }
      if (!ok) {
        setBalanceRefreshWarning(
          "Your report was created, but we could not refresh your balance. Reload the page or try again in a moment.",
        );
      }
    } catch {
      setBalanceRefreshWarning(
        "Your report was created, but we could not refresh your balance. Reload the page or try again in a moment.",
      );
    } finally {
      setLoadingBalance(false);
    }
  }, [fetchBalance]);

  const signOut = useCallback(async () => {
    setError(null);
    setReportResult(null);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setSignedIn(false);
      setClientId(null);
      setTopupReturnUrl(null);
      setBalance(null);
      setBalanceError(null);
      setTopupMessage(null);
      setBalanceRefreshWarning(null);
      window.location.href = "/";
    }
  }, []);

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
    if (!reportResult?.livePaymentProof) {
      return;
    }
    launchPackageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reportResult?.livePaymentProof, reportResult?.package?.reportId]);

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
        const proof = data.livePaymentProof;
        if (proof?.balance.after != null) {
          setBalance(proof.balance.after);
          setCurrency(proof.balance.currency);
          setBalanceError(null);
        }
        await refreshBalanceAfterReport();
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

  const signIn = () => {
    void signInForReport();
  };

  return (
    <>
      <AppHeader
        signedIn={signedIn}
        balance={balance}
        balanceError={balanceError}
        currency={currency}
        loadingBalance={loadingBalance}
        generating={generating}
        clientId={clientId}
        topupReturnUrl={topupReturnUrl}
        onSignIn={signIn}
        onSignOut={() => void signOut()}
        onBalanceRefresh={() => void refreshBalance()}
      />

      <section className="demo-main">
        {authError ? (
          <AuthErrorAlert
            title="We couldn't complete sign-in"
            detail={authErrorDetail ?? authError}
          />
        ) : null}

        <h1 className="demo-tagline">From endpoint to paid agent-ready tool.</h1>
        <p className="demo-subline">
          New Agnic accounts include <strong>$5 starter credit</strong> for your first live
          report.
        </p>

        <EndpointInputComposer
          value={input}
          onChange={setInput}
          disabled={generating}
        />

        {signedIn ? (
          <FlowStatusStrip
            inputRestored={restoredFromOAuth}
            topupMessage={topupMessage}
            balanceRefreshWarning={balanceRefreshWarning}
          />
        ) : (
          <p className="demo-subline demo-subline--tight">
            Sign in with Agnic to generate a live monetization report.
          </p>
        )}

        {signedIn ? (
          <div className="demo-callout">
            <strong>Estimated report generation cost:</strong>{" "}
            {formatMonetizeApiReportGenerationFee(MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD)}{" "}
            per live report. This is MonetizeAPI&apos;s estimate for the Agnic enrichment step—not
            your API price, not a confirmed debit, and not live x402 settlement.
          </div>
        ) : null}

        <div className="demo-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void generateReport("live")}
            disabled={generating}
          >
            {generating
              ? "Generating…"
              : signedIn
                ? "Generate Report"
                : "Sign in & Generate Report"}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => void generateReport("fixture")}
            disabled={generating}
          >
            Try sample (free)
          </button>
          {parseFailed ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => void generateReport("fixture", { useCanonicalFixture: true })}
              disabled={generating}
            >
              Use sample API
            </button>
          ) : null}
        </div>

        <hr className="demo-divider" />
        <InputFormatGuide />

        {error ? (
          <div className="demo-alert demo-alert--error" role="alert">
            {error}
            {needsFunds ? " Add Funds in the header to top up your Agnic balance." : null}
          </div>
        ) : null}

        {reportResult?.package ? (
          <div id="launch-package-ready" ref={launchPackageRef} className="demo-results">
            <h2 className="demo-results__title">Your launch package is ready</h2>
            {reportResult.livePaymentProof ? (
              <LivePaymentProofPanel
                proof={reportResult.livePaymentProof}
                balanceRefreshWarning={balanceRefreshWarning}
                loadingBalance={loadingBalance}
              />
            ) : reportResult.package.mode === "live" ? (
              <div className="demo-alert demo-alert--warning" role="status">
                Payment proof is unavailable. Refresh the page and generate again.
              </div>
            ) : null}
            <p className="demo-results__meta">
              {reportResult.package.mode === "live" ? (
                <>
                  <strong>Live report</strong> — Agnic-backed model enrichment applied.
                </>
              ) : (
                <>
                  <strong>Sample report</strong>
                  {reportResult.parseSource === "fixture_fallback"
                    ? " — company-risk example."
                    : " — no Agnic charge."}
                </>
              )}
            </p>
            {reportResult.package.files["monetization-report.json"] ? (
              <p className="demo-results__meta">
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
              <p className="demo-results__highlights">
                <strong>Highlights:</strong> {reportResult.package.modelInsight}
              </p>
            ) : null}
            <div className="demo-download-row">
              <button type="button" className="btn btn--success" onClick={downloadPackage}>
                Download ZIP
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

function LivePaymentProofPanel({
  proof,
  balanceRefreshWarning,
  loadingBalance,
}: {
  proof: LivePaymentProof;
  balanceRefreshWarning: string | null;
  loadingBalance: boolean;
}) {
  const estimatedLabel = formatMonetizeApiReportGenerationFee(proof.estimatedReportCostUsd);
  const tokenSummary = formatTokenUsage(proof.agnicModelCall.usage);

  let balanceLine: string;
  if (proof.balance.before != null && proof.balance.after != null) {
    const before = `$${proof.balance.before.toFixed(2)}`;
    const after = `$${proof.balance.after.toFixed(2)}`;
    if (proof.confirmedDebitUsd != null) {
      balanceLine = `${before} → ${after} ${proof.balance.currency} (Δ −$${proof.confirmedDebitUsd.toFixed(4)})`;
    } else if (proof.balance.delta === 0) {
      balanceLine = `${before} → ${after} ${proof.balance.currency} (no immediate change)`;
    } else {
      balanceLine = `${before} → ${after} ${proof.balance.currency}`;
    }
  } else if (proof.balance.after != null) {
    balanceLine = `$${proof.balance.after.toFixed(2)} ${proof.balance.currency} (after only)`;
  } else if (proof.balance.before != null) {
    balanceLine = `$${proof.balance.before.toFixed(2)} ${proof.balance.currency} (before only)`;
  } else {
    balanceLine = "Unavailable";
  }

  const confirmedDebitLine =
    proof.confirmedDebitUsd != null
      ? `Confirmed Agnic debit: $${proof.confirmedDebitUsd.toFixed(4)} USD`
      : "Confirmed Agnic debit: none observed (balance unchanged or not exposed per-call)";

  let balanceRefreshLine: string;
  if (loadingBalance) {
    balanceRefreshLine = "Live balance refresh: in progress…";
  } else if (balanceRefreshWarning) {
    balanceRefreshLine = "Live balance refresh: failed — see warning below";
  } else {
    balanceRefreshLine = "Live balance refresh: complete";
  }

  const costSummary =
    proof.confirmedDebitUsd != null
      ? `Confirmed debit ${confirmedDebitLine.replace("Confirmed Agnic debit: ", "")}. Estimated ${estimatedLabel}.`
      : `${confirmedDebitLine}. Estimated ${estimatedLabel} — not charged unless Agnic confirms a debit.`;

  return (
    <div id="payment-usage-proof" className="demo-proof" role="status" aria-live="polite">
      <p className="demo-proof__title">Payment &amp; usage proof</p>
      <ul>
        <li>Report ready — {proof.reportId}</li>
        <li>
          Agnic model call completed (<code>{proof.agnicModelCall.model}</code>
          {tokenSummary ? `, ${tokenSummary}` : ""})
        </li>
        <li>
          Balance: {balanceLine}
          {loadingBalance ? " (refreshing…)" : ""} — {balanceRefreshLine.toLowerCase()}
        </li>
        <li>{proof.balance.note}</li>
        <li>{costSummary}</li>
      </ul>
      {balanceRefreshWarning ? (
        <p className="demo-alert demo-alert--warning" role="status" style={{ marginTop: "0.75rem" }}>
          {balanceRefreshWarning}
        </p>
      ) : null}
    </div>
  );
}

function formatTokenUsage(
  usage?: LivePaymentProof["agnicModelCall"]["usage"],
): string | null {
  if (!usage) {
    return null;
  }
  const parts: string[] = [];
  if (usage.prompt_tokens != null) {
    parts.push(`${usage.prompt_tokens} prompt`);
  }
  if (usage.completion_tokens != null) {
    parts.push(`${usage.completion_tokens} completion`);
  }
  if (usage.total_tokens != null) {
    parts.push(`${usage.total_tokens} total tokens`);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

function AuthErrorAlert({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="demo-alert demo-alert--error" role="alert">
      <strong>{title}</strong>
      {detail ? <p style={{ margin: "0.5rem 0 0" }}>{detail}</p> : null}
    </div>
  );
}

function FlowStatusStrip({
  inputRestored,
  topupMessage,
  balanceRefreshWarning,
}: {
  inputRestored: boolean;
  topupMessage: string | null;
  balanceRefreshWarning: string | null;
}) {
  if (!inputRestored && !topupMessage && !balanceRefreshWarning) {
    return (
      <div className="demo-status demo-status--signed-in">Signed in with Agnic</div>
    );
  }

  return (
    <div className="demo-status demo-status--signed-in">
      {inputRestored ? "Welcome! You've signed with Agnic " : "Signed in with Agnic. "}
      {topupMessage ? `${topupMessage} ` : null}
      {balanceRefreshWarning ? balanceRefreshWarning : null}
    </div>
  );
}
