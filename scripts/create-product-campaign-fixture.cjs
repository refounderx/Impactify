/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function env() {
  return Object.fromEntries(fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8")
    .split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).replace(/^['"]|['"]$/g, "")]));
}

async function request(baseUrl, key, endpoint, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${endpoint}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${method} ${endpoint}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function rpc(baseUrl, key, name, body) {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`RPC ${name}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function main() {
  const settings = env();
  const baseUrl = settings.NEXT_PUBLIC_SUPABASE_URL;
  const key = settings.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) throw new Error("Supabase URL or service role key is missing");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const [organization] = await request(baseUrl, key, "organizations", {
    method: "POST",
    body: { name: `[QA] יעד מוצר ${stamp}`, name_en: `[QA] Product Target ${stamp}`, initials: "QA", color: "#00B5AD", description: "נתוני בדיקה מבודדים ליעדי מוצר וקמפיין.", goals: [] },
  });
  const products = await request(baseUrl, key, "products", {
    method: "POST",
    body: [
      { org_id: organization.id, name: "[QA] מארז חום", name_en: "[QA] Warmth Kit", description: "מוצר בדיקה עם יעד שנתי עצמאי.", price: 120, emoji: "🧣", global_target_quantity: 1000, global_target_goal_type: "annual", global_target_end_date: null, active: true },
      { org_id: organization.id, name: "[QA] סל תמיכה", name_en: "[QA] Support Basket", description: "מוצר בדיקה שני עם יעד שנתי עצמאי.", price: 250, emoji: "🧺", global_target_quantity: 300, global_target_goal_type: "annual", global_target_end_date: null, active: true },
    ],
  });
  const [campaign] = await request(baseUrl, key, "campaigns", {
    method: "POST",
    body: { org_id: organization.id, title: `[QA] קמפיין יעדים ${stamp}`, title_en: `[QA] Target Campaign ${stamp}`, short_desc: "בדיקת הפרדה בין יעד מוצר גלובלי ליעד מוצר בקמפיין.", story: "מוצר ראשון: 40 יחידות. מוצר שני: 12 יחידות.", category: "אחר", goal: 7800, goal_type: "annual", status: "active", emoji: "🧪" },
  });
  await request(baseUrl, key, "campaign_products", { method: "POST", body: [
    { campaign_id: campaign.id, product_id: products[0].id, required_quantity: 40 },
    { campaign_id: campaign.id, product_id: products[1].id, required_quantity: 12 },
  ] });
  await request(baseUrl, key, "donations", { method: "POST", body: [
    { org_id: organization.id, product_id: products[0].id, campaign_id: null, amount: 600, quantity: 5, status: "completed", donation_type: "one_time", currency: "ILS" },
    { org_id: organization.id, product_id: products[0].id, campaign_id: campaign.id, amount: 360, quantity: 3, status: "completed", donation_type: "one_time", currency: "ILS" },
    { org_id: organization.id, product_id: products[1].id, campaign_id: campaign.id, amount: 500, quantity: 2, status: "completed", donation_type: "one_time", currency: "ILS" },
  ] });
  const communities = await request(baseUrl, key, "communities?select=id");
  const invitations = communities.length ? await request(baseUrl, key, "partnership_requests", {
    method: "POST",
    body: communities.map(({ id }) => ({ community_id: id, campaign_id: campaign.id, org_id: organization.id, initiator_type: "organization", status: "queued" })),
  }) : [];
  const [globalProgress, campaignProgress] = await Promise.all([
    rpc(baseUrl, key, "get_product_progress", { p_product_ids: products.map((product) => product.id) }),
    rpc(baseUrl, key, "get_campaign_product_progress", { p_campaign_id: campaign.id, p_product_id: products[0].id }),
  ]);
  console.log(JSON.stringify({
    organizationId: organization.id,
    campaignId: campaign.id,
    productIds: products.map((product) => product.id),
    invitationsCreated: invitations.length,
    expected: { productA: { global: "8 / 1000 units", campaign: "3 / 40 units" }, productB: { global: "2 / 300 units", campaign: "2 / 12 units" }, campaignGoal: "₪7,800" },
    observed: { globalProgress, campaignProductA: campaignProgress },
    urls: {
      campaign: `/campaign/${campaign.id}`,
      productADirect: `/product/${products[0].id}`,
      productAFromCampaign: `/product/${products[0].id}?campaign_id=${campaign.id}`,
      productBDirect: `/product/${products[1].id}`,
      productBFromCampaign: `/product/${products[1].id}?campaign_id=${campaign.id}`,
    },
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
