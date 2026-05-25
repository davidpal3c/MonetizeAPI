export const AGNIC_TOPUP_ORIGIN = "https://app.agnic.ai";
export const AGNIC_TOPUP_COMPLETE_MESSAGE = "agnic:topup_complete";

export function buildAgnicTopupUrl(params: {
  clientId: string;
  returnUrl: string;
}): string {
  const search = new URLSearchParams({
    client_id: params.clientId.trim(),
    return_url: params.returnUrl,
  });
  return `${AGNIC_TOPUP_ORIGIN}/topup?${search.toString()}`;
}

export type ReportPackageFileMap = Record<string, string>;

export type ReportPackage = {
  reportId: string;
  mode: "live" | "fixture";
  generatedAt: string;
  model?: string;
  modelInsight?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  files: ReportPackageFileMap;
};

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
  confirmedDebitUsd: number | null;
  balance: {
    before: number | null;
    after: number | null;
    delta: number | null;
    currency: string;
    refreshStatus: "ok" | "partial" | "failed";
    note: string;
  };
  spendVerification: {
    spendApiAvailable: boolean;
    oauthScopes: string;
    attempts: Array<{ path: string; httpStatus: number | "network_error" }>;
    summary: string;
  };
};

export type PaidReportGenerationResult = {
  package: ReportPackage;
  parseSource: "user_input" | "fixture_fallback";
  livePaymentProof?: LivePaymentProof;
};

export function serializeReportPackageClient(pkg: ReportPackage): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
