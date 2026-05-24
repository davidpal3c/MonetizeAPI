import {
  buildAgnicConfigFromAccessToken,
  generateFixtureReportPackage,
  generatePaidReportPackage,
} from "@monetize-api/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "../../../../lib/agnic-cookies";

export const dynamic = "force-dynamic";

type GenerateBody = {
  input?: string;
  mode?: "live" | "fixture";
};

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawInput = typeof body.input === "string" ? body.input : "";
  const mode = body.mode === "fixture" ? "fixture" : "live";

  if (mode === "fixture") {
    try {
      const result = await generateFixtureReportPackage(rawInput);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fixture report failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "not_signed_in", message: "Sign in with Agnic to generate a paid report." },
      { status: 401 },
    );
  }

  const credentialCheck = buildAgnicConfigFromAccessToken(accessToken);
  if (!credentialCheck.ready || !credentialCheck.config) {
    return NextResponse.json(
      {
        error: "missing_config",
        missing: credentialCheck.missing,
        message: "Server Agnic configuration is incomplete.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await generatePaidReportPackage({
      config: credentialCheck.config,
      rawInput,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paid report generation failed";
    const httpStatus =
      err instanceof Error && "httpStatus" in err
        ? (err as Error & { httpStatus?: number }).httpStatus
        : 502;

  const isBalanceError =
      httpStatus === 402 ||
      /balance|credit|insufficient|payment/i.test(message);

    return NextResponse.json(
      {
        error: message,
        needsFunds: isBalanceError,
      },
      { status: httpStatus ?? 502 },
    );
  }
}