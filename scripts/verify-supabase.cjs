/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function loadEnv() {
  const text = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
  return Object.fromEntries(
    text.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function inspectTable(baseUrl, key, table) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
  });
  const range = response.headers.get("content-range") ?? "unknown";
  return { table, status: response.status, count: range.split("/")[1] ?? "unknown" };
}

async function fetchRows(baseUrl, key, path) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Verification query failed: HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const env = loadEnv();
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) throw new Error("Supabase URL or service role key is missing");

  const tables = [
    "organizations", "campaigns", "products", "communities", "donations",
    "hero_cards", "site_content", "site_datasets",
  ];
  const results = await Promise.all(tables.map((table) => inspectTable(baseUrl, key, table)));
  for (const result of results) console.log(`${result.table}: HTTP ${result.status}, rows ${result.count}`);

  const datasets = await fetchRows(baseUrl, key, "site_datasets?select=key&order=key");
  const datasetKeys = datasets.map(({ key: datasetKey }) => datasetKey);
  const expectedKeys = ["community_admin", "landing", "nonprofit_admin", "shared"];
  console.log(`site_datasets keys: ${datasetKeys.join(", ")}`);

  const organizations = await fetchRows(
    baseUrl,
    key,
    "organizations?select=id,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,phone,video_gradient"
  );
  const profileFieldsComplete = organizations.every((organization) =>
    ["founded", "founded_en", "ceo", "ceo_en", "volunteers", "address", "address_en", "phone", "video_gradient"]
      .every((field) => organization[field] !== null)
  );
  console.log(`organization profiles complete: ${profileFieldsComplete} (${organizations.length} checked)`);
  const schemaResponse = await fetch(`${baseUrl}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/openapi+json" },
  });
  if (schemaResponse.ok) {
    const schema = await schemaResponse.json();
    const rpcPaths = Object.keys(schema.paths ?? {}).filter((route) => route.startsWith("/rpc/"));
    console.log(`RPC functions: ${rpcPaths.length ? rpcPaths.join(", ") : "none"}`);
  }
  if (
    results.some((result) => ![200, 206].includes(result.status)) ||
    JSON.stringify(datasetKeys) !== JSON.stringify(expectedKeys) ||
    !profileFieldsComplete
  ) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
