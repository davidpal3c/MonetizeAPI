import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runAgnicDemoProof } from "../agnic/demo-proof.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../../../../examples/company-risk-score",
);
const outputPath = path.join(outputDir, "agnic-demo-proof.json");

const proof = await runAgnicDemoProof();
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

console.log(`Agnic demo proof status: ${proof.status}`);
console.log(proof.reason);

if (proof.response?.replyPreview) {
  console.log(`Model: ${proof.response.model}`);
  console.log(`Reply preview: ${proof.response.replyPreview}`);
}

if (proof.error) {
  console.error(`Error: ${proof.error.message}`);
}

console.log(`Proof written to ${outputPath}`);

if (proof.status === "error") {
  process.exitCode = 1;
}
