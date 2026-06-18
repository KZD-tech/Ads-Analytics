/**
 * Seed script — inserts 30 days of realistic sample data into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * This script uses the service role key (bypasses RLS).
 * It will:
 *   1. Ensure ad_platforms rows exist (meta, google)
 *   2. Create 4 sample campaigns (2 Meta, 2 Google)
 *   3. Insert 30 days of daily metrics for each campaign
 *   4. Insert sync log entries
 */

import { createClient } from "@supabase/supabase-js";
import { subDays, format } from "date-fns";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (tsx doesn't auto-load env)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// --- Helpers ---

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

// Simulate a slight upward trend over 30 days with daily noise
function trendValue(day: number, base: number, variance: number, trend: number): number {
  const trendComponent = base + (day * trend);
  const noise = randomBetween(-variance, variance);
  return Math.max(0, trendComponent + noise);
}

async function ensurePlatform(name: "meta" | "google"): Promise<string> {
  const { data, error } = await supabase
    .from("ad_platforms")
    .select("id")
    .eq("name", name)
    .single();

  if (error || !data) {
    const { data: newRow, error: insertErr } = await supabase
      .from("ad_platforms")
      .insert({ name })
      .select("id")
      .single();
    if (insertErr || !newRow) throw new Error(`Failed to create platform ${name}: ${insertErr?.message}`);
    return newRow.id;
  }
  return data.id;
}

async function ensureCampaign(
  platformId: string,
  externalId: string,
  name: string,
  objective: string,
  status: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("id")
    .eq("campaign_id_external", externalId)
    .single();

  if (data) return data.id;

  const { data: newRow, error: insertErr } = await supabase
    .from("ad_campaigns")
    .insert({
      platform_id: platformId,
      campaign_id_external: externalId,
      campaign_name: name,
      objective,
      status,
    })
    .select("id")
    .single();

  if (insertErr || !newRow) throw new Error(`Failed to insert campaign ${name}: ${insertErr?.message}`);
  return newRow.id;
}

function calcMetrics(impressions: number, clicks: number, spend: number, conversions: number, revenue: number) {
  return {
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(4)) : null,
    cpc: clicks > 0 ? Number((spend / clicks).toFixed(4)) : null,
    cpm: impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(4)) : null,
    roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : null,
    cpa: conversions > 0 ? Number((spend / conversions).toFixed(4)) : null,
  };
}

// --- Main ---

async function main() {
  console.log("🌱 Seeding ad analytics data...\n");

  // 1. Ensure platforms
  const metaId = await ensurePlatform("meta");
  const googleId = await ensurePlatform("google");
  console.log(`✓ Platforms: meta=${metaId}, google=${googleId}`);

  // 2. Create campaigns
  const campaigns = [
    { platformId: metaId, externalId: "meta_001", name: "Promosi Raya 2026", objective: "conversion", status: "active" },
    { platformId: metaId, externalId: "meta_002", name: "Brand Awareness Q2", objective: "awareness", status: "active" },
    { platformId: googleId, externalId: "google_001", name: "Search - Generic Keywords", objective: "traffic", status: "active" },
    { platformId: googleId, externalId: "google_002", name: "Display Retargeting", objective: "conversion", status: "paused" },
  ];

  const campaignIds: { id: string; name: string; platform: "meta" | "google" }[] = [];
  for (const c of campaigns) {
    const id = await ensureCampaign(c.platformId, c.externalId, c.name, c.objective, c.status);
    campaignIds.push({
      id,
      name: c.name,
      platform: c.platformId === metaId ? "meta" : "google",
    });
    console.log(`✓ Campaign: ${c.name} (${id})`);
  }

  // 3. Insert 30 days of metrics
  const today = new Date();
  let totalInserted = 0;
  let totalUpdated = 0;

  for (const c of campaignIds) {
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const reportDate = format(subDays(today, dayOffset), "yyyy-MM-dd");
      const day = 29 - dayOffset; // 0 = oldest, 29 = today

      // Different baselines per campaign
      let impressions: number, clicks: number, spend: number, conversions: number, revenue: number;

      if (c.name.includes("Raya")) {
        // High performing conversion campaign
        impressions = Math.round(trendValue(day, 8000, 1500, 50));
        clicks = Math.round(trendValue(day, 200, 40, 3));
        spend = Number(trendValue(day, 150, 25, 2).toFixed(2));
        conversions = Math.round(trendValue(day, 8, 3, 0.3));
        revenue = Number((conversions * randomBetween(80, 120)).toFixed(2));
      } else if (c.name.includes("Awareness")) {
        // Awareness — high reach, low conversion
        impressions = Math.round(trendValue(day, 25000, 5000, 100));
        clicks = Math.round(trendValue(day, 350, 80, 2));
        spend = Number(trendValue(day, 80, 15, 1).toFixed(2));
        conversions = Math.round(randomBetween(0, 3));
        revenue = Number((conversions * randomBetween(30, 60)).toFixed(2));
      } else if (c.name.includes("Search")) {
        // Google Search — moderate, steady
        impressions = Math.round(trendValue(day, 5000, 1000, 20));
        clicks = Math.round(trendValue(day, 150, 30, 2));
        spend = Number(trendValue(day, 120, 20, 1.5).toFixed(2));
        conversions = Math.round(trendValue(day, 5, 2, 0.2));
        revenue = Number((conversions * randomBetween(70, 100)).toFixed(2));
      } else {
        // Display Retargeting — low spend, moderate conversion, paused after day 20
        if (day > 20) continue; // Skip paused days
        impressions = Math.round(trendValue(day, 3000, 600, 10));
        clicks = Math.round(trendValue(day, 80, 20, 1));
        spend = Number(trendValue(day, 40, 8, 0.5).toFixed(2));
        conversions = Math.round(trendValue(day, 3, 1, 0.1));
        revenue = Number((conversions * randomBetween(50, 80)).toFixed(2));
      }

      const derived = calcMetrics(impressions, clicks, spend, conversions, revenue);

      // Check if metric exists
      const { data: existing } = await supabase
        .from("ad_daily_metrics")
        .select("id")
        .eq("campaign_id", c.id)
        .eq("report_date", reportDate)
        .single();

      const payload = {
        campaign_id: c.id,
        report_date: reportDate,
        impressions,
        clicks,
        spend,
        reach: impressions, // Simplify: reach = impressions
        conversions,
        revenue,
        ...derived,
      };

      if (existing) {
        const { error } = await supabase
          .from("ad_daily_metrics")
          .update(payload)
          .eq("id", existing.id);
        if (error) {
          console.error(`  ✗ Update failed: ${c.name} ${reportDate}: ${error.message}`);
        } else {
          totalUpdated++;
        }
      } else {
        const { error } = await supabase
          .from("ad_daily_metrics")
          .insert(payload);
        if (error) {
          console.error(`  ✗ Insert failed: ${c.name} ${reportDate}: ${error.message}`);
        } else {
          totalInserted++;
        }
      }
    }
  }

  console.log(`\n✓ Metrics: ${totalInserted} inserted, ${totalUpdated} updated`);

  // 4. Insert sync log entries
  for (const platform of ["meta", "google"] as const) {
    const { error } = await supabase.from("n8n_sync_log").insert({
      platform,
      sync_date: format(today, "yyyy-MM-dd"),
      status: "success",
      records_inserted: Math.floor(totalInserted / 2),
      records_updated: Math.floor(totalUpdated / 2),
      synced_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`  ✗ Sync log error: ${error.message}`);
    } else {
      console.log(`✓ Sync log: ${platform} success`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`   Total campaigns: ${campaignIds.length}`);
  console.log(`   Total metric rows: ${totalInserted + totalUpdated}`);
  console.log(`   Date range: ${format(subDays(today, 29), "yyyy-MM-dd")} → ${format(today, "yyyy-MM-dd")}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});