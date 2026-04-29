import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const manifestPath = path.join(nextDir, "build-manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("Missing .next/build-manifest.json. Run `npm run build` before checking performance budgets.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rootFiles = [...(manifest.rootMainFiles ?? []), ...(manifest.polyfillFiles ?? [])]
  .filter((file) => typeof file === "string" && file.endsWith(".js"));

const rootBudgetBytes = 650 * 1024;
const largestChunkBudgetBytes = 220 * 1024;

let rootBytes = 0;
let largestChunkBytes = 0;
let largestChunkName = "";

for (const relativeFile of rootFiles) {
  const absoluteFile = path.join(nextDir, relativeFile);
  const stats = fs.statSync(absoluteFile);
  rootBytes += stats.size;
  if (stats.size > largestChunkBytes) {
    largestChunkBytes = stats.size;
    largestChunkName = relativeFile;
  }
}

const failures = [];

if (rootBytes > rootBudgetBytes) {
  failures.push(
    `Core app JavaScript is ${rootBytes} bytes, over the ${rootBudgetBytes} byte budget.`
  );
}

if (largestChunkBytes > largestChunkBudgetBytes) {
  failures.push(
    `Largest shared chunk (${largestChunkName}) is ${largestChunkBytes} bytes, over the ${largestChunkBudgetBytes} byte budget.`
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

console.log(
  `Performance budgets passed. Core app JS: ${rootBytes} bytes. Largest shared chunk: ${largestChunkBytes} bytes (${largestChunkName}).`
);
