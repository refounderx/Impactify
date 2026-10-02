import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), ".next", "static");
const textualExtensions = /\.(?:css|html|js|json|map|txt)$/i;
const forbiddenLiterals = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PAYMENT_TERMINAL_CREDENTIALS_JSON",
  "X-tranzila-api-app-key",
  "X-tranzila-api-access-token",
  "BEGIN PRIVATE KEY",
];
const secretEnvironmentKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PAYMENT_TERMINAL_CREDENTIALS_JSON",
  "TRANZILA_API_SECRET",
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

const findings = [];
for (const path of await filesUnder(root)) {
  if (!textualExtensions.test(path)) continue;
  const contents = await readFile(path, "utf8");
  for (const literal of forbiddenLiterals) {
    if (contents.includes(literal)) findings.push({ path, rule: `forbidden literal: ${literal}` });
  }
  for (const key of secretEnvironmentKeys) {
    const value = process.env[key];
    if (value && value.length >= 16 && !value.startsWith("test-") && contents.includes(value)) {
      findings.push({ path, rule: `exact server secret from ${key}` });
    }
  }
}

if (findings.length) {
  console.error("Client bundle secret scan failed:");
  for (const finding of findings) console.error(`- ${finding.path}: ${finding.rule}`);
  process.exitCode = 1;
} else {
  console.log("Client bundle secret scan passed.");
}
