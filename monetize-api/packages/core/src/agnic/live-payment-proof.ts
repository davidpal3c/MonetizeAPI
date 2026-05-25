import { fetchAgnicBalance } from "./balance.js";
import type { AgnicConfig } from "./config.js";
import { MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD } from "./report-generation-cost.js";
import {
  probeAgnicSpendVerification,
  type AgnicSpendVerificationProbe,
} from "./spend-verification-probe.js";

const BALANCE_DELTA_EPSILON_USD = 0.0001;

export type LivePaymentProof = {
  reportGenerated: true;
  reportId: string;
  agnicModelCall: {
    completed: true;
    model: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  estimatedReportCostUsd: number;
  /** Set only when balance before/after show a positive debit above epsilon. */
  confirmedDebitUsd: number | null;
  balance: {
    before: number | null;
    after: number | null;
    delta: number | null;
    currency: string;
    refreshStatus: "ok" | "partial" | "failed";
    note: string;
  };
  spendVerification: AgnicSpendVerificationProbe;
};

export type AgnicBalanceSnapshot = {
  balance: number;
  currency: string;
};

export async function captureAgnicBalanceSnapshot(
  config: AgnicConfig,
): Promise<AgnicBalanceSnapshot | null> {
  try {
    const snapshot = await fetchAgnicBalance(config.accessToken, {
      partnerId: config.partnerId,
    });
    return { balance: snapshot.balance, currency: snapshot.currency };
  } catch {
    return null;
  }
}

function roundUsd(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function buildBalanceNote(params: {
  before: number | null;
  after: number | null;
  delta: number | null;
  confirmedDebitUsd: number | null;
}): { refreshStatus: LivePaymentProof["balance"]["refreshStatus"]; note: string } {
  const { before, after, delta, confirmedDebitUsd } = params;

  if (before == null && after == null) {
    return {
      refreshStatus: "failed",
      note: "Could not read Agnic balance before or after report generation.",
    };
  }

  if (before == null || after == null) {
    return {
      refreshStatus: "partial",
      note: "Balance snapshot is partial; Agnic may not expose an immediate per-call delta on totalBalance.",
    };
  }

  if (confirmedDebitUsd != null) {
    return {
      refreshStatus: "ok",
      note: `Balance decreased by $${confirmedDebitUsd.toFixed(4)} ${"USD"} after the Agnic model call.`,
    };
  }

  if (delta != null && Math.abs(delta) <= BALANCE_DELTA_EPSILON_USD) {
    return {
      refreshStatus: "ok",
      note:
        "Balance unchanged after report generation. Agnic may settle model usage asynchronously or not expose per-call debits on totalBalance.",
    };
  }

  return {
    refreshStatus: "ok",
    note: "Balance snapshots captured; no confirmed per-call debit matched the estimated report cost.",
  };
}

export function assembleLivePaymentProof(params: {
  reportId: string;
  model: string;
  usage?: LivePaymentProof["agnicModelCall"]["usage"];
  beforeSnapshot: AgnicBalanceSnapshot | null;
  afterSnapshot: AgnicBalanceSnapshot | null;
  spendVerification: AgnicSpendVerificationProbe;
}): LivePaymentProof {
  const before = params.beforeSnapshot?.balance ?? null;
  const after = params.afterSnapshot?.balance ?? null;
  const currency =
    params.afterSnapshot?.currency ?? params.beforeSnapshot?.currency ?? "USD";

  let delta: number | null = null;
  let confirmedDebitUsd: number | null = null;

  if (before != null && after != null) {
    delta = roundUsd(before - after);
    if (delta > BALANCE_DELTA_EPSILON_USD) {
      confirmedDebitUsd = delta;
    } else if (delta <= BALANCE_DELTA_EPSILON_USD) {
      delta = 0;
    }
  }

  const { refreshStatus, note } = buildBalanceNote({
    before,
    after,
    delta,
    confirmedDebitUsd,
  });

  return {
    reportGenerated: true,
    reportId: params.reportId,
    agnicModelCall: {
      completed: true,
      model: params.model,
      usage: params.usage,
    },
    estimatedReportCostUsd: MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD,
    confirmedDebitUsd,
    balance: {
      before,
      after,
      delta,
      currency,
      refreshStatus,
      note,
    },
    spendVerification: params.spendVerification,
  };
}

export async function buildLivePaymentProof(params: {
  config: AgnicConfig;
  reportId: string;
  model: string;
  usage?: LivePaymentProof["agnicModelCall"]["usage"];
  beforeSnapshot: AgnicBalanceSnapshot | null;
  afterSnapshot: AgnicBalanceSnapshot | null;
}): Promise<LivePaymentProof> {
  const spendVerification = await probeAgnicSpendVerification(params.config.accessToken, {
    partnerId: params.config.partnerId,
  });

  return assembleLivePaymentProof({
    reportId: params.reportId,
    model: params.model,
    usage: params.usage,
    beforeSnapshot: params.beforeSnapshot,
    afterSnapshot: params.afterSnapshot,
    spendVerification,
  });
}
