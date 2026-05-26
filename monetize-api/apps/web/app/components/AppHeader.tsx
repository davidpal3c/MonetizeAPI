"use client";

import { AddFundsButton } from "./AddFundsButton";

type AppHeaderProps = {
  signedIn: boolean;
  balance: number | null;
  balanceError: string | null;
  currency: string;
  loadingBalance: boolean;
  generating: boolean;
  clientId: string | null;
  topupReturnUrl: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onBalanceRefresh: () => void;
};

function formatHeaderBalance(
  balance: number | null,
  balanceError: string | null,
  currency: string,
  loading: boolean,
): string {
  if (loading) {
    return "Balance: …";
  }
  if (balance != null) {
    return `$${balance.toFixed(2)} ${currency}`;
  }
  if (balanceError) {
    return "Balance unavailable";
  }
  return "Balance unavailable";
}

export function AppHeader({
  signedIn,
  balance,
  balanceError,
  currency,
  loadingBalance,
  generating,
  clientId,
  topupReturnUrl,
  onSignIn,
  onSignOut,
  onBalanceRefresh,
}: AppHeaderProps) {
  return (
    <header className="demo-header">
      <span className="demo-header__brand">MonetizeAPI</span>
      <div className="demo-header__actions">
        {signedIn ? (
          <>
            <span className="demo-header__balance" title={balanceError ?? undefined}>
              {formatHeaderBalance(balance, balanceError, currency, loadingBalance)}
            </span>
            <AddFundsButton
              clientId={clientId}
              topupReturnUrl={topupReturnUrl}
              onBalanceRefresh={onBalanceRefresh}
              disabled={!clientId}
              label="Add Funds"
              className="btn btn--secondary"
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onSignOut}
              disabled={generating}
            >
              Logout
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={onSignIn}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
