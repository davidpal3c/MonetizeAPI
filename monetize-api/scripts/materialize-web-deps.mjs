/**
 * Vercel runs noop.js from apps/web and resolves next only under
 * apps/web/node_modules. pnpm workspaces often leave next at the workspace
 * root or as symlinks. Copy real package trees into apps/web/node_modules.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const webModules = path.join(root, "apps", "web", "node_modules");

// Only `next` is required for Vercel's noop.js probe. Copying react/react-dom
// can duplicate React and break prerender (useContext null).
const PACKAGES = ["next"];

function resolveSourceDir(packageName) {
  const candidates = [
    path.join(root, "node_modules", packageName),
    path.join(webModules, packageName),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    return fs.realpathSync(candidate);
  }
  return null;
}

function materializePackage(packageName) {
  const source = resolveSourceDir(packageName);
  if (!source) {
    console.error(`[materialize-web-deps] missing package: ${packageName}`);
    return false;
  }

  const dest = path.join(webModules, packageName);
  fs.mkdirSync(webModules, { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(source, dest, { recursive: true, dereference: true });
  return true;
}

fs.mkdirSync(webModules, { recursive: true });

let ok = true;
for (const name of PACKAGES) {
  if (!materializePackage(name)) ok = false;
}

const runtime = path.join(
  webModules,
  "next",
  "dist",
  "compiled",
  "next-server",
  "server.runtime.prod.js",
);

if (!ok) {
  process.exit(1);
}

if (!fs.existsSync(runtime)) {
  console.error("[materialize-web-deps] missing after copy:", runtime);
  process.exit(1);
}

console.log(
  `[materialize-web-deps] copied ${PACKAGES.join(", ")} into apps/web/node_modules`,
);
