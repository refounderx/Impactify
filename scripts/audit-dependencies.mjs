import { spawnSync } from "node:child_process";

const allowedAdvisories = new Map([
  ["https://github.com/advisories/GHSA-vfj7-8cjw-p6xm", {
    expiresOn: "2026-10-31",
    owner: "Impactify maintainers",
    reason: "Unpatched braces advisory reachable only through the ESLint development toolchain",
  }],
]);
const severityRank = { info: 1, low: 2, moderate: 3, high: 4, critical: 5 };
const extraArguments = process.argv.slice(2);
if (extraArguments.some((value) => value !== "--strict-ssl=false")) {
  throw new Error("Unsupported dependency-audit argument");
}

function runAudit(omitDevelopment) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : (process.platform === "win32" ? "npm.cmd" : "npm");
  const args = npmCli ? [npmCli, "audit", "--json", "--audit-level=moderate"] : ["audit", "--json", "--audit-level=moderate"];
  if (omitDevelopment) args.push("--omit=dev");
  args.push(...extraArguments);
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: !npmCli && process.platform === "win32",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error("npm audit did not return valid JSON");
  }
  if (report?.auditReportVersion !== 2 || typeof report.vulnerabilities !== "object") {
    throw new Error(`npm audit failed: ${report?.message ?? "unexpected response"}`);
  }
  return report;
}

function isModerateOrHigher(vulnerability) {
  return (severityRank[vulnerability.severity] ?? 0) >= severityRank.moderate;
}

function rootAdvisories(name, vulnerabilities, visiting = new Set()) {
  if (visiting.has(name)) return new Set();
  const vulnerability = vulnerabilities[name];
  if (!vulnerability) return new Set([`dependency:${name}`]);
  const nextVisiting = new Set(visiting).add(name);
  const roots = new Set();
  for (const via of vulnerability.via ?? []) {
    if (typeof via === "string") {
      for (const root of rootAdvisories(via, vulnerabilities, nextVisiting)) roots.add(root);
    } else if (typeof via?.url === "string") {
      roots.add(via.url);
    } else {
      roots.add(`advisory:${String(via?.source ?? "unknown")}`);
    }
  }
  return roots;
}

const productionReport = runAudit(true);
const productionFindings = Object.values(productionReport.vulnerabilities).filter(isModerateOrHigher);
if (productionFindings.length) {
  throw new Error(`Production dependency audit failed: ${productionFindings.map((item) => item.name).join(", ")}`);
}

const fullReport = runAudit(false);
const findings = Object.values(fullReport.vulnerabilities).filter(isModerateOrHigher);
const usedAllowlist = new Set();
const failures = [];
const today = new Date().toISOString().slice(0, 10);
for (const finding of findings) {
  const roots = rootAdvisories(finding.name, fullReport.vulnerabilities);
  if (!roots.size) failures.push(`${finding.name}: no root advisory found`);
  for (const advisory of roots) {
    const allowed = allowedAdvisories.get(advisory);
    if (!allowed) {
      failures.push(`${finding.name}: ${advisory}`);
      continue;
    }
    if (today > allowed.expiresOn) {
      failures.push(`${finding.name}: allowlist expired on ${allowed.expiresOn}`);
      continue;
    }
    usedAllowlist.add(advisory);
  }
}

if (failures.length) throw new Error(`Dependency audit failed: ${failures.join("; ")}`);
for (const advisory of usedAllowlist) {
  const allowed = allowedAdvisories.get(advisory);
  console.warn("dependency_audit_allowlist", {
    advisory,
    expiresOn: allowed.expiresOn,
    owner: allowed.owner,
    reason: allowed.reason,
  });
}
console.log(`Dependency audit passed: 0 production findings, ${findings.length} allowlisted development finding(s).`);
