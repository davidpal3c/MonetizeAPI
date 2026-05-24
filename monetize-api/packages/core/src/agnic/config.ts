export type AgnicConfig = {
  baseUrl: string;
  partnerId: string;
  accessToken: string;
  model: string;
};

export type AgnicCredentialCheck = {
  ready: boolean;
  missing: string[];
  config?: AgnicConfig;
};

const DEFAULT_BASE_URL = "https://api.agnic.ai/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** Agnic requires "author/model" (e.g. openai/gpt-4o-mini). */
export function normalizeAgnicModel(raw: string): string {
  const model = raw.trim();
  if (!model) {
    return DEFAULT_MODEL;
  }
  if (model.includes("/")) {
    return model;
  }
  return `openai/${model}`;
}

export function loadAgnicConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): AgnicCredentialCheck {
  const missing: string[] = [];

  const accessToken = env.AGNIC_ACCESS_TOKEN?.trim();
  const partnerId = env.AGNIC_PARTNER_ID?.trim();

  if (!accessToken) {
    missing.push("AGNIC_ACCESS_TOKEN");
  }
  if (!partnerId) {
    missing.push("AGNIC_PARTNER_ID");
  }

  if (missing.length > 0) {
    return { ready: false, missing };
  }

  return {
    ready: true,
    missing: [],
    config: {
      baseUrl: (env.AGNIC_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
      partnerId: partnerId!,
      accessToken: accessToken!,
      model: normalizeAgnicModel(env.AGNIC_MODEL ?? DEFAULT_MODEL),
    },
  };
}

/** Build config from OAuth cookie token + server env (web proof route). */
export function buildAgnicConfigFromAccessToken(
  accessToken: string,
  env: NodeJS.ProcessEnv = process.env,
): AgnicCredentialCheck {
  const missing: string[] = [];
  const token = accessToken.trim();
  const partnerId = env.AGNIC_PARTNER_ID?.trim();

  if (!token) {
    missing.push("agnic_access_token");
  }
  if (!partnerId) {
    missing.push("AGNIC_PARTNER_ID");
  }

  if (missing.length > 0) {
    return { ready: false, missing };
  }

  return {
    ready: true,
    missing: [],
    config: {
      baseUrl: (env.AGNIC_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
      partnerId: partnerId!,
      accessToken: token,
      model: normalizeAgnicModel(env.AGNIC_MODEL ?? DEFAULT_MODEL),
    },
  };
}
