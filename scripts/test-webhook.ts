/**
 * Test webhook script — sends sample data to the local webhook endpoint.
 *
 * Usage:
 *   npx tsx scripts/test-webhook.ts
 *
 * Make sure the dev server is running (npm run dev) and
 * N8N_WEBHOOK_SECRET is set in .env.local.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load env
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
}

const API_KEY = env.N8N_WEBHOOK_SECRET || "change-this-to-a-strong-secret";
const BASE_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WEBHOOK_URL = `${BASE_URL}/api/webhook/n8n`;

const today = new Date().toISOString().slice(0, 10);

const payload = {
  platform: "meta" as const,
  report_date: today,
  campaigns: [
    {
      campaign_id_external: "test_webhook_001",
      campaign_name: "Test Campaign from Script",
      status: "active" as const,
      objective: "conversion" as const,
      impressions: 12000,
      clicks: 340,
      spend: 220.5,
      reach: 9500,
      conversions: 18,
      revenue: 1800.0,
    },
    {
      campaign_id_external: "test_webhook_002",
      campaign_name: "Test Awareness Campaign",
      status: "active" as const,
      objective: "awareness" as const,
      impressions: 45000,
      clicks: 520,
      spend: 95.0,
      reach: 38000,
      conversions: 2,
      revenue: 120.0,
    },
  ],
};

async function main() {
  console.log(`📤 Sending webhook to: ${WEBHOOK_URL}`);
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...`);
  console.log(`   Platform: ${payload.platform}`);
  console.log(`   Date: ${payload.report_date}`);
  console.log(`   Campaigns: ${payload.campaigns.length}\n`);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log(`\n📥 Response (${res.status}):`);
  console.log(JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log("\n✅ Webhook test passed!");
  } else {
    console.error("\n❌ Webhook test failed!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});