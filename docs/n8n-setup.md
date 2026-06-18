# n8n Setup Guide — Ad Analytics Dashboard

Panduan untuk setup n8n workflows yang akan tarik data dari Meta Ads dan Google Ads setiap hari dan hantar ke webhook dashboard.

---

## 1. Keperluan Umum

### Credentials yang diperlukan:

| Credential | Di mana dapat | Digunakan oleh |
|---|---|---|
| Meta Marketing API Access Token | [Meta Developer Dashboard](https://developers.facebook.com/) | Meta Ads workflow |
| Meta Ad Account ID | Meta Business Manager (format: `act_XXXXXXXXXX`) | Meta Ads workflow |
| Google Ads Developer Token | [Google Ads API](https://developers.google.com/google-ads/api/docs/first-api-call) | Google Ads workflow |
| Google Ads Client Customer ID | Google Ads account (format: `XXX-XXX-XXXX`) | Google Ads workflow |
| Google Ads Refresh Token | OAuth 2.0 flow di Google Ads API | Google Ads workflow |
| N8N_WEBHOOK_SECRET | Dicipta sendiri (string random) | Kedua-dua workflow |

### Webhook URL:

```
POST https://your-domain.com/api/webhook/n8n
Header: x-api-key: <N8N_WEBHOOK_SECRET>
Content-Type: application/json
```

---

## 2. Meta Ads Workflow

### Setup di n8n:

1. **Buat workflow baru** di n8n

2. **Tambah Schedule Trigger node:**
   - Type: `Cron`
   - Expression: `0 2 * * *` (setiap hari jam 2:00 pagi)

3. **Tambah HTTP Request node (Meta Marketing API):**
   - Method: `GET`
   - URL: `https://graph.facebook.com/v19.0/act_<AD_ACCOUNT_ID>/insights`
   - Query Parameters:
     - `access_token`: Meta Marketing API Access Token
     - `level`: `campaign`
     - `fields`: `campaign_id,campaign_name,objective,impressions,clicks,spend,reach,actions,conversion_values,date_start`
     - `time_increment`: `1`
     - `date_preset`: `yesterday`
   - Authentication: Generic Credential Type → Header Auth

4. **Tambah Code/Function node** untuk transform data:
   ```javascript
   // Transform Meta API response ke format webhook
   const insights = items[0].json.data;
   const reportDate = items[0].json.data[0]?.date_start || new Date().toISOString().slice(0, 10);

   const campaigns = insights.map(c => {
     const conversions = c.actions?.find(a => a.action_type === 'offsite_conversion')?.value || 0;
     const revenue = c.conversion_values?.find(a => a.action_type === 'offsite_conversion')?.value || 0;

     return {
       campaign_id_external: c.campaign_id,
       campaign_name: c.campaign_name,
       status: 'active',
       objective: c.objective || 'conversion',
       impressions: parseInt(c.impressions) || 0,
       clicks: parseInt(c.clicks) || 0,
       spend: parseFloat(c.spend) || 0,
       reach: parseInt(c.reach) || 0,
       conversions: parseInt(conversions) || 0,
       revenue: parseFloat(revenue) || 0,
     };
   });

   return [{
     json: {
       platform: 'meta',
       report_date: reportDate,
       campaigns,
     }
   }];
   ```

5. **Tambah HTTP Request node (POST ke webhook):**
   - Method: `POST`
   - URL: `https://your-domain.com/api/webhook/n8n`
   - Headers:
     - `x-api-key`: N8N_WEBHOOK_SECRET
     - `Content-Type`: `application/json`
   - Body: `={{ JSON.stringify($json) }}`

### Diagram aliran:
```
Schedule (2:00 AM) → GET Meta API → Transform Code → POST Webhook
```

---

## 3. Google Ads Workflow

### Setup di n8n:

1. **Buat workflow baru** di n8n

2. **Tambah Schedule Trigger node:**
   - Type: `Cron`
   - Expression: `0 3 * * *` (setiap hari jam 3:00 pagi)

3. **Tambah HTTP Request node (Google Ads API):**
   - Method: `POST`
   - URL: `https://googleads.googleapis.com/v16/customers/<CUSTOMER_ID>/googleAds:searchStream`
   - Headers:
     - `Authorization: Bearer {{OAuth2 access token}}`
     - `developer-token: <DEVELOPER_TOKEN>`
   - Body:
   ```json
   {
     "query": "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_objective, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, segments.date FROM campaign WHERE segments.date = YESTERDAY"
   }
   ```

4. **Tambah Code/Function node** untuk transform:
   ```javascript
   // Transform Google Ads API response ke format webhook
   const results = items[0].json[0]?.results || [];
   const reportDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

   const campaigns = results.map(r => {
     return {
       campaign_id_external: String(r.campaign?.id || ''),
       campaign_name: r.campaign?.name || 'Unknown',
       status: r.campaign?.status === 'ENABLED' ? 'active' : (r.campaign?.status || 'active').toLowerCase(),
       objective: r.campaign?.advertising_objective?.type?.toLowerCase() || 'traffic',
       impressions: parseInt(r.metrics?.impressions) || 0,
       clicks: parseInt(r.metrics?.clicks) || 0,
       spend: parseFloat(r.metrics?.costMicros || 0) / 1000000, // micros to currency
       reach: parseInt(r.metrics?.impressions) || 0, // Google doesn't report reach separately
       conversions: parseInt(r.metrics?.conversions) || 0,
       revenue: parseFloat(r.metrics?.conversionsValue || 0),
     };
   });

   return [{
     json: {
       platform: 'google',
       report_date: reportDate,
       campaigns,
     }
   }];
   ```

5. **Tambah HTTP Request node (POST ke webhook)** — sama seperti Meta workflow.

---

## 4. Menguji Webhook Secara Lokal

### Cara 1: Script test (recommended)

```bash
# Pastikan dev server berjalan
npm run dev

# Jalankan script test (di terminal lain)
npx tsx scripts/test-webhook.ts
```

### Cara 2: curl

```bash
curl -X POST http://localhost:3000/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{
    "platform": "meta",
    "report_date": "2026-06-18",
    "campaigns": [
      {
        "campaign_id_external": "test_001",
        "campaign_name": "Test Campaign",
        "status": "active",
        "objective": "conversion",
        "impressions": 10000,
        "clicks": 250,
        "spend": 150.00,
        "reach": 8000,
        "conversions": 12,
        "revenue": 1200.00
      }
    ]
  }'
```

### Cara 3: ngrok untuk n8n webhook testing

Jika n8n anda berjalan di server lain, guna ngrok untuk dedah port lokal:

```bash
ngrok http 3000
# Gunakan URL ngrok (e.g., https://abc123.ngrok.io) sebagai webhook URL di n8n
```

---

## 5. Troubleshooting

| Masalah | Sebab | Penyelesaian |
|---|---|---|
| `401 Unauthorized` | API key salah | Semak `N8N_WEBHOOK_SECRET` di .env.local dan header n8n |
| `400 Bad Request` | Body format salah | Pastikan JSON ada `platform`, `report_date`, `campaigns[]` |
| `500 Server Error` | Supabase service key salah | Semak `SUPABASE_SERVICE_ROLE_KEY` di env |
| Data tidak masuk | Campaign upsert gagal | Semak sync log di `n8n_sync_log` table |
| RLS block | Policy tidak aktif | Jalankan migration SQL di Supabase SQL Editor |