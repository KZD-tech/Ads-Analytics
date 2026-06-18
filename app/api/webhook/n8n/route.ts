import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { calculateMetrics } from "@/lib/metrics";
import type { N8nWebhookPayload, Platform } from "@/types/ads";

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();

  // 1. Validate API key
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedKey) {
    console.error("[webhook] N8N_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfigured: missing webhook secret" },
      { status: 500 },
    );
  }

  if (apiKey !== expectedKey) {
    console.error("[webhook] Invalid API key");
    return NextResponse.json(
      { error: "Unauthorized: invalid API key" },
      { status: 401 },
    );
  }

  // 2. Parse body
  let body: N8nWebhookPayload;
  try {
    body = await request.json();
  } catch {
    console.error("[webhook] Invalid JSON body");
    return NextResponse.json(
      { error: "Bad request: invalid JSON" },
      { status: 400 },
    );
  }

  const { platform, report_date, campaigns } = body;

  if (!platform || !report_date || !Array.isArray(campaigns)) {
    console.error("[webhook] Missing required fields");
    return NextResponse.json(
      { error: "Bad request: platform, report_date, and campaigns[] required" },
      { status: 400 },
    );
  }

  if (platform !== "meta" && platform !== "google") {
    console.error(`[webhook] Invalid platform: ${platform}`);
    return NextResponse.json(
      { error: `Invalid platform: ${platform}. Must be 'meta' or 'google'` },
      { status: 400 },
    );
  }

  console.log(
    `[webhook] Received ${campaigns.length} campaigns for ${platform} on ${report_date}`,
  );

  // 3. Get platform id
  const { data: platformRow, error: platformError } = await supabase
    .from("ad_platforms")
    .select("id")
    .eq("name", platform)
    .single();

  if (platformError || !platformRow) {
    console.error("[webhook] Platform not found:", platformError);
    return NextResponse.json(
      { error: `Platform '${platform}' not found in ad_platforms` },
      { status: 500 },
    );
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // 4. Process each campaign
  for (const c of campaigns) {
    if (!c.campaign_id_external || !c.campaign_name) {
      errors.push(`Skipped: missing campaign_id_external or campaign_name`);
      continue;
    }

    // Upsert campaign
    const { data: existingCampaign, error: campaignQueryError } = await supabase
      .from("ad_campaigns")
      .select("id")
      .eq("campaign_id_external", c.campaign_id_external)
      .single();

    let campaignId: string;

    if (existingCampaign) {
      // Update
      const { error: updateErr } = await supabase
        .from("ad_campaigns")
        .update({
          campaign_name: c.campaign_name,
          status: c.status,
          objective: c.objective,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCampaign.id);

      if (updateErr) {
        errors.push(
          `Failed to update campaign ${c.campaign_name}: ${updateErr.message}`,
        );
        continue;
      }
      campaignId = existingCampaign.id;
    } else {
      // Insert
      const { data: newCampaign, error: insertErr } = await supabase
        .from("ad_campaigns")
        .insert({
          platform_id: platformRow.id,
          campaign_id_external: c.campaign_id_external,
          campaign_name: c.campaign_name,
          status: c.status || "active",
          objective: c.objective,
        })
        .select("id")
        .single();

      if (insertErr || !newCampaign) {
        errors.push(
          `Failed to insert campaign ${c.campaign_name}: ${insertErr?.message}`,
        );
        continue;
      }
      campaignId = newCampaign.id;
    }

    // Calculate derived metrics
    const derived = calculateMetrics(
      c.impressions || 0,
      c.clicks || 0,
      c.spend || 0,
      c.conversions || 0,
      c.revenue || 0,
    );

    // Upsert daily metrics
    const { data: existingMetric, error: metricQueryError } = await supabase
      .from("ad_daily_metrics")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("report_date", report_date)
      .single();

    const metricPayload = {
      campaign_id: campaignId,
      report_date,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      spend: c.spend || 0,
      reach: c.reach || 0,
      conversions: c.conversions || 0,
      revenue: c.revenue || 0,
      ctr: derived.ctr,
      cpc: derived.cpc,
      cpm: derived.cpm,
      roas: derived.roas,
      cpa: derived.cpa,
    };

    if (existingMetric) {
      const { error: metricUpdateErr } = await supabase
        .from("ad_daily_metrics")
        .update(metricPayload)
        .eq("id", existingMetric.id);
      if (metricUpdateErr) {
        errors.push(
          `Failed to update metrics for ${c.campaign_name}: ${metricUpdateErr.message}`,
        );
      } else {
        updated++;
      }
    } else {
      const { error: metricInsertErr } = await supabase
        .from("ad_daily_metrics")
        .insert(metricPayload);
      if (metricInsertErr) {
        errors.push(
          `Failed to insert metrics for ${c.campaign_name}: ${metricInsertErr.message}`,
        );
      } else {
        inserted++;
      }
    }
  }

  // 5. Log sync
  const status: "success" | "failed" | "partial" =
    errors.length === 0 ? "success" : errors.length === campaigns.length ? "failed" : "partial";

  await supabase.from("n8n_sync_log").insert({
    platform: platform as Platform,
    sync_date: report_date,
    status,
    records_inserted: inserted,
    records_updated: updated,
    error_message: errors.length > 0 ? errors.join("\n") : null,
    synced_at: new Date().toISOString(),
  });

  console.log(
    `[webhook] Done: ${inserted} inserted, ${updated} updated, ${errors.length} errors`,
  );

  return NextResponse.json({
    success: status !== "failed",
    inserted,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}