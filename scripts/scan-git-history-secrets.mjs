import { spawnSync } from "node:child_process";

const result = spawnSync("git", ["log", "-p", "--all", "--full-history", "--no-ext-diff", "--no-color", "--", "."], {
  cwd: process.cwd(),
  encoding: "utf8",
  maxBuffer: 512 * 1024 * 1024,
});
if (result.status !== 0) throw new Error("Unable to read git history for secret scanning");

const tokenRules = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Stripe live key", /\bsk_live_[A-Za-z0-9]{20,}\b/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/],
];
const assignment = /\b(SUPABASE_SERVICE_ROLE_KEY|PAYMENT_TERMINAL_CREDENTIALS_JSON|TRANZILA_[A-Z0-9_]*(?:KEY|SECRET|PASSWORD)|CARD(?:COM)?_[A-Z0-9_]*(?:KEY|SECRET|PASSWORD))\s*[:=]\s*["']?([^\s,"'}]+)/i;
const placeholders = /^(?:YOUR_|REDACTED|EXAMPLE|PLACEHOLDER|TEST[-_]|<|\.{3}$|eyJ\.\.\.)/i;
const findings = [];
let commit = "unknown";
let path = "unknown";

for (const line of result.stdout.split(/\r?\n/)) {
  if (line.startsWith("commit ")) commit = line.slice(7, 19);
  if (line.startsWith("+++ b/")) path = line.slice(6);
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const contents = line.slice(1);
  for (const [rule, pattern] of tokenRules) {
    if (pattern.test(contents)) findings.push({ commit, path, rule });
  }
  const assigned = contents.match(assignment);
  if (assigned && assigned[2].length >= 8 && !placeholders.test(assigned[2])) {
    findings.push({ commit, path, rule: `${assigned[1]} assignment` });
  }
}

const unique = [...new Map(findings.map((finding) => [`${finding.commit}:${finding.path}:${finding.rule}`, finding])).values()];
if (unique.length) {
  console.error("Git history secret scan found possible secrets (values redacted):");
  for (const finding of unique) console.error(`- ${finding.commit} ${finding.path}: ${finding.rule}`);
  process.exitCode = 1;
} else {
  console.log("Git history secret scan passed.");
}
