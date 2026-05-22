/**
 * node-linker=hoisted leaves `next` at workspace root only.
 * Vercel's noop.js resolves from apps/web and does not bundle symlink targets;
 * copy `next` into apps/web/node_modules (real files, not a symlink).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextAtRoot = path.join(root, "node_modules", "next");
const webModules = path.join(root, "apps", "web", "node_modules");
const dest = path.join(webModules, "next");

if (!fs.existsSync(nextAtRoot)) {
  console.warn("[link-next-in-web] skip: workspace next not found");
  process.exit(0);
}

fs.mkdirSync(webModules, { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(nextAtRoot, dest, { recursive: true, dereference: true });

const runtime = path.join(
  dest,
  "dist",
  "compiled",
  "next-server",
  "server.runtime.prod.js",
);
if (!fs.existsSync(runtime)) {
  console.error("[link-next-in-web] missing after copy:", runtime);
  process.exit(1);
}

console.log("[link-next-in-web] copied next into apps/web/node_modules");
