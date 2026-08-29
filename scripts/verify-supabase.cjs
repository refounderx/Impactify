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
    "hero_cards", "site_content", "site_datasets", "admin_role_audit",
    "ngo_updates", "community_campaigns",
  ];
  const results = await Promise.all(tables.map((table) => inspectTable(baseUrl, key, table)));
  for (const result of results) console.log(`${result.table}: HTTP ${result.status}, rows ${result.count}`);

  const datasets = await fetchRows(baseUrl, key, "site_datasets?select=key&order=key");
  const datasetKeys = datasets.map(({ key: datasetKey }) => datasetKey);
  const expectedKeys = ["landing", "shared"];
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

  const profiles = await fetchRows(
    baseUrl,
    key,
    "profiles?select=app_role,org_id,community_id,onboarding_completed_at"
  );
  const allowedRoles = new Set(["donor", "ngo_owner", "community_owner", "admin"]);
  const profilesConsistent = profiles.every((profile) => {
    if (!allowedRoles.has(profile.app_role)) return false;
    if (!profile.onboarding_completed_at) return profile.app_role === "donor" && !profile.org_id && !profile.community_id;
    if (profile.app_role === "ngo_owner") return Boolean(profile.org_id) && !profile.community_id;
    if (profile.app_role === "community_owner") return !profile.org_id && Boolean(profile.community_id);
    return !profile.org_id && !profile.community_id;
  });
  console.log(`profile role/tenant consistency: ${profilesConsistent} (${profiles.length} checked)`);

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bankProbe = await fetch(`${baseUrl}/rest/v1/organizations?select=bank_account&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const bankFieldsProtected = !bankProbe.ok;
  console.log(`organization bank fields blocked for anon: ${bankFieldsProtected} (HTTP ${bankProbe.status})`);
  const publicCampaignProbe = await fetch(`${baseUrl}/rest/v1/campaigns?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const publicCampaignsReadable = publicCampaignProbe.ok;
  console.log(`active campaigns readable for anon: ${publicCampaignsReadable} (HTTP ${publicCampaignProbe.status})`);
  const campaignMediaProbe = await fetch(
    `${baseUrl}/rest/v1/campaigns?select=hero_image_url,video_url&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const campaignMediaColumnsReady = campaignMediaProbe.ok;
  console.log(`campaign media columns ready: ${campaignMediaColumnsReady} (HTTP ${campaignMediaProbe.status})`);
  const campaignMediaBucketProbe = await fetch(`${baseUrl}/storage/v1/bucket/campaign-media`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const campaignMediaBucketReady = campaignMediaBucketProbe.ok;
  console.log(`campaign media bucket ready: ${campaignMediaBucketReady} (HTTP ${campaignMediaBucketProbe.status})`);
  const adminRpcProbe = await fetch(`${baseUrl}/rest/v1/rpc/admin_update_profile_role`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_profile_id: "00000000-0000-0000-0000-000000000000",
      p_role: "admin",
      p_org_id: null,
      p_community_id: null,
    }),
  });
  const anonAdminRpcBlocked = !adminRpcProbe.ok;
  console.log(`admin role RPC blocked for anon: ${anonAdminRpcBlocked} (HTTP ${adminRpcProbe.status})`);
  const schemaResponse = await fetch(`${baseUrl}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/openapi+json" },
  });
  if (schemaResponse.ok) {
    const schema = await schemaResponse.json();
    const rpcPaths = Object.keys(schema.paths ?? {}).filter((route) => route.startsWith("/rpc/"));
    console.log(`RPC functions: ${rpcPaths.length ? rpcPaths.join(", ") : "none"}`);
    const requiredRpcs = ["/rpc/save_ngo_update", "/rpc/manage_ngo_update", "/rpc/set_community_campaign"];
    const missingRpcs = requiredRpcs.filter((route) => !rpcPaths.includes(route));
    console.log(`updates/community RPCs ready: ${missingRpcs.length === 0}`);
    if (missingRpcs.length > 0) process.exitCode = 1;
  }
  if (
    results.some((result) => ![200, 206].includes(result.status)) ||
    JSON.stringify(datasetKeys) !== JSON.stringify(expectedKeys) ||
    !profileFieldsComplete ||
    !profilesConsistent ||
    !bankFieldsProtected ||
    !publicCampaignsReadable ||
    !campaignMediaColumnsReady ||
    !campaignMediaBucketReady ||
    !anonAdminRpcBlocked
  ) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
