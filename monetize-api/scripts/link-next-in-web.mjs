/**
 * With node-linker=hoisted, `next` lives at workspace root only.
 * Vercel's serverless packager runs noop.js from apps/web and does not
 * resolve parent node_modules; symlink next into apps/web/node_modules.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextAtRoot = path.join(root, "node_modules", "next");
const webModules = path.join(root, "apps", "web", "node_modules");
const linkPath = path.join(webModules, "next");

if (!fs.existsSync(nextAtRoot)) {
  process.exit(0);
}

fs.mkdirSync(webModules, { recursive: true });
try {
  const stat = fs.lstatSync(linkPath);
  if (stat.isSymbolicLink() || stat.isDirectory()) {
    fs.unlinkSync(linkPath);
  }
} catch {
  // absent
}

fs.symlinkSync("../../node_modules/next", linkPath);
