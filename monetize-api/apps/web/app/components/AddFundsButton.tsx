"use client";

import { useCallback, useEffect } from "react";

import {
  AGNIC_TOPUP_COMPLETE_MESSAGE,
  AGNIC_TOPUP_ORIGIN,
  buildAgnicTopupUrl,
} from "../../lib/agnic-client";

type AddFundsButtonProps = {
  clientId: string | null;
  topupReturnUrl: string | null;
  balance?: number | null;
  currency?: string;
  onBalanceRefresh: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  showBalance?: boolean;
};

function formatBalance(balance: number | null | undefined, currency = "USD"): string {
  if (balance == null || Number.isNaN(balance)) {
    return "";
  }
  return ` ($${balance.toFixed(2)} ${currency})`;
}

export function AddFundsButton({
  clientId,
  topupReturnUrl,
  balance,
  currency = "USD",
  onBalanceRefresh,
  disabled = false,
  label = "Add Funds",
  className = "btn btn--secondary",
  showBalance = false,
}: AddFundsButtonProps) {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== AGNIC_TOPUP_ORIGIN) {
        return;
      }
      if (event.data?.type === AGNIC_TOPUP_COMPLETE_MESSAGE) {
        onBalanceRefresh();
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onBalanceRefresh]);

  const openTopup = useCallback(() => {
    if (!clientId || !topupReturnUrl) {
      return;
    }

    const url = buildAgnicTopupUrl({
      clientId,
      returnUrl: topupReturnUrl,
    });

    if (window.innerWidth < 640) {
      window.location.href = url;
      return;
    }

    window.open(url, "agnic-topup", "width=480,height=720,popup=yes");
  }, [clientId, topupReturnUrl]);

  const isDisabled = disabled || !clientId || !topupReturnUrl;
  const balanceSuffix = showBalance ? formatBalance(balance, currency) : "";

  return (
    <button
      type="button"
      onClick={openTopup}
      disabled={isDisabled}
      className={className}
      title={
        !topupReturnUrl
          ? "Top-up is not available right now"
          : !clientId
            ? "Sign in is required for top-up"
            : undefined
      }
    >
      {label}
      {balanceSuffix}
    </button>
  );
}
