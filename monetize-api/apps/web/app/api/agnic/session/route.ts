import { resolveTopupReturnUrl } from "@monetize-api/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "../../../../lib/agnic-cookies";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const clientId = process.env.AGNIC_CLIENT_ID?.trim();

  return NextResponse.json({
    signedIn: Boolean(accessToken),
    clientId: clientId ?? null,
    partnerConfigured: Boolean(process.env.AGNIC_PARTNER_ID?.trim()),
    topupReturnUrl: resolveTopupReturnUrl(request),
  });
}
