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
