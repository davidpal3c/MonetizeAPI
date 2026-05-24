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

  try {
    const balance = await fetchAgnicBalance(accessToken);
    return NextResponse.json(balance);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Balance fetch failed";
    const httpStatus =
      err instanceof Error && "httpStatus" in err
        ? (err as Error & { httpStatus?: number }).httpStatus
        : 502;
    return NextResponse.json({ error: message }, { status: httpStatus ?? 502 });
  }
}
