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

export type PaidReportGenerationResult = {
  package: ReportPackage;
  parseSource: "user_input" | "fixture_fallback";
};

export function serializeReportPackageClient(pkg: ReportPackage): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
