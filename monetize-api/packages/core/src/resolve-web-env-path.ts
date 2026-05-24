import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFile } from "./load-env-file.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Canonical local env file for Agnic credentials (Next.js + CLI). */
export const WEB_ENV_LOCAL_PATH = path.resolve(
  __dirname,
  "../../../apps/web/.env.local",
);

export function loadWebEnvLocal(): void {
  loadEnvFile(WEB_ENV_LOCAL_PATH);
}
