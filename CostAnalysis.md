# EnglishPro - Cloud Cost Analysis

## Assumptions

| Metric | Small | Medium | Growth |
|--------|-------|--------|--------|
| Monthly Active Users | 500 | 5,000 | 25,000 |
| Video Storage | 100 GB | 1 TB | 5 TB |
| Bandwidth/month | 500 GB | 5 TB | 25 TB |
| Video Transcoding | 50 hrs | 500 hrs | 2,500 hrs |

---

## AWS (Amazon Web Services)

| Service | Small | Medium | Growth |
|---------|-------|--------|--------|
| EC2 (t3.small backend) | $15 | $60 (t3.medium) | $150 (t3.large x2) |
| RDS PostgreSQL | $15 | $50 | $200 |
| ElastiCache Redis | $12 | $50 | $150 |
| S3 Storage | $2 | $23 | $115 |
| CloudFront CDN | $45 | $425 | $2,125 |
| MediaConvert | $25 | $250 | $1,250 |
| **Total/month** | **~$115** | **~$860** | **~$4,000** |

---

## Google Cloud Platform (GCP)

| Service | Small | Medium | Growth |
|---------|-------|--------|--------|
| Compute Engine (e2-small) | $12 | $50 | $130 |
| Cloud SQL PostgreSQL | $10 | $50 | $180 |
| Memorystore Redis | $15 | $55 | $160 |
| Cloud Storage | $2 | $20 | $100 |
| Cloud CDN | $40 | $400 | $2,000 |
| Transcoder API | $20 | $200 | $1,000 |
| **Total/month** | **~$100** | **~$775** | **~$3,570** |

---

## Microsoft Azure

| Service | Small | Medium | Growth |
|---------|-------|--------|--------|
| App Service (B1) | $13 | $55 | $150 |
| Azure Database PostgreSQL | $25 | $100 | $300 |
| Azure Cache Redis | $16 | $60 | $180 |
| Blob Storage | $2 | $21 | $105 |
| Azure CDN | $40 | $380 | $1,900 |
| Media Services | $30 | $300 | $1,500 |
| **Total/month** | **~$126** | **~$916** | **~$4,135** |

---

## Cloudflare + Budget Stack (Recommended for Startups)

| Service | Small | Medium | Growth |
|---------|-------|--------|--------|
| Railway/Render (Backend) | $5 | $25 | $100 |
| Supabase (Postgres + Auth) | $0 (free) | $25 | $100 |
| Upstash Redis | $0 (free) | $10 | $50 |
| Cloudflare R2 Storage | $0 (10GB free) | $15 | $75 |
| Cloudflare CDN | $0 (free) | $0 | $20 (Pro) |
| Mux Video (transcoding + delivery) | $20 | $200 | $1,000 |
| **Total/month** | **~$25** | **~$275** | **~$1,345** |

---

## Summary Comparison

| Provider | Small | Medium | Growth | Best For |
|----------|-------|--------|--------|----------|
| **Cloudflare Stack** | $25 | $275 | $1,345 | Startups, cost-sensitive |
| **GCP** | $100 | $775 | $3,570 | Good free tier, ML features |
| **AWS** | $115 | $860 | $4,000 | Enterprise, most services |
| **Azure** | $126 | $916 | $4,135 | Microsoft ecosystem |

---

## Recommendation

### For MVP/Startup Phase: Cloudflare Stack
- Cloudflare R2 (no egress fees) + Mux for video = massive savings
- Free tiers for Supabase, Upstash, Cloudflare CDN
- Estimated cost: **$25-$275/month**

### For Scale: AWS or GCP
- More mature video transcoding pipelines
- Better enterprise support
- More regions for global delivery
- Estimated cost: **$775-$4,000/month**

---

## Cost Optimization Tips

1. **Use Cloudflare R2** - Zero egress fees (vs S3's $0.09/GB)
2. **Lazy transcoding** - Only transcode videos when first requested
3. **Adaptive bitrate** - Serve appropriate quality based on user connection
4. **Cache aggressively** - Cache video segments at CDN edge
5. **Reserved instances** - 30-50% savings on compute with 1-year commitment
6. **Spot instances** - Use for video transcoding jobs (up to 90% savings)

---

## Notes

- Prices are estimates based on published rates as of 2024
- Actual costs vary based on usage patterns and region
- Free tiers may have limitations (requests, storage, bandwidth)
- Consider data transfer costs between services
