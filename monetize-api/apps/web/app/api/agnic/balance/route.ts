import { fetchAgnicBalance } from "@monetize-api/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "../../../../lib/agnic-cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value?.trim();

  if (!accessToken) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const partnerId = process.env.AGNIC_PARTNER_ID?.trim();

  try {
    const balance = await fetchAgnicBalance(accessToken, { partnerId: partnerId || undefined });
    return NextResponse.json({
      balance: balance.balance,
      currency: balance.currency,
      totalBalance: balance.totalBalance,
      creditBalance: balance.creditBalance,
      usdcBalance: balance.usdcBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Balance fetch failed";
    const httpStatus =
      err instanceof Error && "httpStatus" in err
        ? (err as Error & { httpStatus?: number }).httpStatus
        : 502;
    return NextResponse.json({ error: message }, { status: httpStatus ?? 502 });
  }
}
