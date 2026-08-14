# EnglishGoPro — Cloud Deployment Options & Cost Analysis

**Domain:** [englishgopro.com](https://englishgopro.com), registered via Cloudflare.

## 1. Current architecture (as built)

| Piece | Reality in the repo today | Deployment implication |
|---|---|---|
| Backend | Single Express process (`backend/src/index.ts`) that serves the API **and** runs the BullMQ transcode worker in-process | Fine on one box; on multi-instance PaaS you'd run API and worker as separate services |
| Database | Prisma schema targets **PostgreSQL** (`backend/prisma/schema.prisma`), but local dev has been using a `dev.db` SQLite file | Needs a real Postgres instance in every option below; local dev.db is gitignored and irrelevant to prod |
| Queue/cache | Redis, required for both BullMQ (`queue.service.ts`) and the response cache (`middleware/cache.ts`) | Needs a managed or self-hosted Redis |
| Video storage | **Local filesystem** (`storage.service.ts`, `STORAGE_PATH` env var) — videos, thumbnails, HLS segments, submissions, avatars all written to disk on the box running the server | This is the main blocker for anything beyond a single persistent-disk server. Horizontal scaling or ephemeral-disk PaaS (Render/Railway/Heroku-style redeploys) will lose files unless you either attach a persistent volume or swap to object storage |
| Uploads | Multer with **memory storage** (`middleware/upload.ts`) — files land in a buffer before `storage.service.ts` writes them | Good news: swapping the storage backend to S3/R2 is a contained change (one service file), not a rewrite |
| Transcoding | Shells out to a local `ffmpeg` binary (`ffmpeg.service.ts`, defaults to `/opt/homebrew/bin/ffmpeg`) | Any container image needs `ffmpeg`/`ffprobe` installed; path must be overridden via `FFMPEG_PATH` |
| Containers | No `Dockerfile` / `docker-compose.yml` exist yet | Needs to be written for any container-based option (all three below) |
| Frontend | Vite/React static build (`frontend`) | Trivial to deploy anywhere that serves static files + CDN |

**Bottom line:** the app can be deployed as-is to a single server with a persistent disk with almost no code changes. Anything that wants multiple backend instances, zero-downtime redeploys, or a real CDN in front of video needs the storage layer moved to object storage (S3-compatible) first — see [Section 5](#5-migration-checklist-by-option).

---

## 2. Options at a glance

| | Option A: AWS Lightsail | Option B: Managed PaaS + Object Storage | Option C: Full AWS |
|---|---|---|---|
| **Effort to launch** | Lowest — Dockerize, deploy, done | Medium — swap storage to R2/S3 first | Highest — most moving pieces |
| **Code changes needed** | None beyond writing Dockerfiles | Rewrite `storage.service.ts` to use S3-compatible SDK | Same as B, plus IAM/networking config |
| **Scales horizontally?** | No (single instance) | Yes | Yes |
| **Ops burden** | You patch the OS, manage backups | Low — providers manage DB/Redis/storage | Higher — more services to wire together, but most managed |
| **Best for** | Validating the product, <500 users | Real launch, growing user base | Enterprise scale, compliance needs, dedicated infra team |

---

## 3. Option A — AWS Lightsail (Docker Compose, everything on one instance)

**Domain:** `englishgopro.com`, registered through Cloudflare Registrar — which means it's already on Cloudflare's nameservers by default, so DNS hosting isn't an extra step to set up.

**Stack:** One Lightsail Linux instance running Docker Compose: Postgres container, Redis container, backend container (API + worker), Nginx serving the frontend build and reverse-proxying `/api`. **Everything — OS, Docker images, the Postgres data volume, and all video/thumbnail/HLS/submission files — lives on the single disk that ships with the instance plan** (confirmed: one disk, `nvme0n1`, 60GB total / 58GB usable, no second volume, no `nvme1n1`). No separate Lightsail Block Storage is used, and no automated snapshot backups are configured for this option — see the risk note below. A Lightsail **static IP** (free while attached to a running instance) is what `englishgopro.com` and `www.englishgopro.com` will point at.

**Why this fits today's code:** `STORAGE_PATH` already points at a local directory — no storage code changes required. It just points at a subdirectory of the boot disk instead of a mounted volume. On the backend, set `FRONTEND_URL=https://englishgopro.com` (for CORS) and on the frontend, `VITE_API_URL=https://englishgopro.com/api`.

**DNS setup (in the Cloudflare dashboard, since that's where the domain already lives):**
- `A` record: `englishgopro.com` → the Lightsail static IP
- `A` (or `CNAME`) record: `www.englishgopro.com` → the same IP (or redirect to the root)
- Since the domain is already on Cloudflare, the only real decision is **proxied vs. DNS-only** for each record — that's the "is Cloudflare required" question in practice:

| | Proxied (orange cloud) | DNS-only (grey cloud) |
|---|---|---|
| TLS | Free, auto-renewed by Cloudflare at the edge | Certbot/Let's Encrypt running on the instance (free, but you manage renewal via a cron job/systemd timer) |
| Video/HLS delivery | Cached at Cloudflare's edge — reduces load and bandwidth use on the instance | Served directly off the instance — every view eats into the plan's bandwidth allowance and CPU |
| DDoS/bot protection | Included free | None — the instance is directly exposed |
| Cost | $0 (free plan) | $0 (no extra service, just certbot on-box) |

Since the domain is already sitting in Cloudflare, proxying costs nothing extra and is the easier path (no certbot renewal to babysit) — but DNS-only is still a completely reasonable choice if you'd rather traffic go straight to the instance. Nothing else in the setup changes either way.

**The real constraint: everything shares one 60GB disk.** On the current instance that's 58GB usable, already 24GB used (41%) by the OS + whatever's installed, leaving **~34GB free** for Docker images, Postgres data, *and* every video ever uploaded. That's a hard, low ceiling for a video-hosting app:
- Practically, budget maybe 20–25GB of that headroom for actual video/HLS storage once Docker images and the Postgres data directory are accounted for — call it dozens of short lesson videos, not hundreds.
- There's no independent volume to grow just for storage. **Growing capacity means upgrading the whole instance to a larger plan** (Lightsail migrates the bundled disk when you change plans), not attaching a second disk.
- Set up **disk-usage monitoring/alerting** (e.g. a cron `df` check emailing you past 80%) since there's no separate volume to signal "storage is full" independently of the OS disk filling up and taking the whole instance down.

**Backup risk (accepted for this option):** with no automated snapshots, there is currently **no backup** of the database or uploaded videos — a disk failure, `rm -rf` mistake, or corrupted Postgres volume means real data loss with no recovery path. If that risk isn't acceptable once real user data/videos are on the instance, the lightest-weight mitigation without paying for full snapshots is a scheduled `pg_dump` pushed to a cheap off-box location (e.g. a free-tier object storage bucket or even email/Drive for a small dump) — that protects the database at near-zero cost even though video files themselves stay unbacked-up.

**Tradeoffs:** single point of failure, no auto-scaling, you own OS patching, tight and inflexible storage headroom, no backups, and outbound bandwidth beyond the plan's included allowance is metered.

### Cost (monthly)

| Tier | Users | Lightsail instance plan (single disk, no add-on volume, no snapshots) | Total |
|---|---|---|---|
| Small (current) | ~500 MAU, small video library | $7/mo plan — 60GB SSD (single disk, ~34GB free today) | **~$7** |
| Medium | ~5,000 MAU | Upgrade to $24 or $44 plan for more disk (80–160GB) — the only way to get more storage on this architecture | **~$24–44** |
| Growth | ~25,000 MAU | Video library will exceed what any single-disk plan can hold — migrate to Option B/C before this point | — |

Cloudflare is optional (see table above) and free either way, so it doesn't move these numbers. Note this table assumes video storage stays modest; if the library grows faster than expected, upgrading the instance plan (bigger single disk) is the only lever available in this option — there's no storage-only scaling path without moving to Option B's object storage.

---

## 4. Option B — Managed PaaS + Object Storage (recommended starting point)

**Stack:** Railway or Render for the backend (2 services: `api` and `worker`, both from the same image), Neon or Supabase for Postgres, Upstash for Redis (serverless, pay-per-request — fits bursty transcoding workloads), **Cloudflare R2** for video/thumbnail/submission storage (S3-compatible API, zero egress fees), Cloudflare CDN in front of R2 for delivery, Vercel/Cloudflare Pages for the static frontend.

**Required code change:** `storage.service.ts` needs an S3-compatible backend (swap `fs/promises` calls for `@aws-sdk/client-s3` pointed at R2's endpoint) — everything upstream of it (multer memory storage, controllers) stays the same since uploads already arrive as in-memory buffers. `ffmpeg.service.ts` needs to write its output to a temp dir, then upload the resulting HLS segments to R2 rather than leaving them on local disk.

### Cost (monthly)

| Service | Small (~500 MAU) | Medium (~5k MAU) | Growth (~25k MAU) |
|---|---|---|---|
| Railway/Render (API + worker) | $10 | $40 | $150 |
| Postgres (Neon/Supabase) | $0 (free tier) | $25 | $100 |
| Redis (Upstash, pay-per-request) | $0 (free tier) | $15 | $60 |
| Cloudflare R2 storage (100GB/1TB/5TB) | $1.50 | $15 | $75 |
| R2 egress | $0 (free egress) | $0 | $0 |
| Cloudflare CDN/Pages | $0 | $0 | $20 (Pro) |
| Transcoding compute (folded into worker above; self-hosted ffmpeg) | — | — | consider Mux ($20–$1,000) if self-hosted ffmpeg can't keep up |
| **Total/month** | **~$12–30** | **~$95–175** | **~$400–1,400** |

This is the same shape as the "Cloudflare + Budget Stack" row in `CostAnalysis.md`, refined against what the codebase actually needs to change.

---

## 5. Option C — Full AWS (ECS Fargate + RDS + ElastiCache + S3 + CloudFront)

**Stack:** ECS Fargate services for API and worker (auto-scaling), RDS Postgres (Multi-AZ for prod), ElastiCache Redis, S3 for storage (same code change as Option B — the AWS SDK v3 S3 client is a near drop-in for R2 since both speak the S3 API), CloudFront CDN, optionally AWS Elemental MediaConvert instead of self-hosted ffmpeg for transcoding at scale. Frontend on S3 + CloudFront or Amplify.

**Best for:** once you need multi-region, VPC isolation, compliance certifications, SSO, or your transcoding volume outgrows what a couple of worker containers can chew through.

### Cost (monthly)

| Service | Small | Medium | Growth |
|---|---|---|---|
| ECS Fargate (API + worker) | $30 | $120 | $350 |
| RDS PostgreSQL | $15 | $50 | $200 |
| ElastiCache Redis | $12 | $50 | $150 |
| S3 storage | $2 | $23 | $115 |
| CloudFront CDN | $45 | $425 | $2,125 |
| MediaConvert (transcoding) | $25 | $250 | $1,250 |
| **Total/month** | **~$130** | **~$920** | **~$4,190** |

(Consistent with the AWS row already in `CostAnalysis.md`; the difference here is Fargate instead of a bare EC2 box, which costs a bit more but removes patching/scaling ops work.)

---

## 6. Recommendation

1. **Now → first real users:** Option A (AWS Lightsail). Zero storage-layer code changes, cheapest, gets you live this week, and stays in the AWS console if you later want to graduate to Option C without switching providers.
2. **Once you have paying users or need zero-downtime deploys:** migrate to Option B. The one required change — swapping `storage.service.ts` to R2 — is contained and worth doing before you have terabytes of video to migrate later.
3. **Only move to Option C (AWS)** when you hit a concrete driver: compliance requirement, need for multi-region, or self-hosted ffmpeg genuinely can't keep up with transcoding demand (at which point MediaConvert or Mux become worth their premium).

## 7. Migration checklist by option

**Option A (AWS Lightsail, single disk):**
- [ ] Write `Dockerfile` for backend (include `ffmpeg`/`ffprobe`, set `FFMPEG_PATH`), `Dockerfile` for frontend (or serve via Nginx static)
- [ ] Write `docker-compose.yml` wiring Postgres, Redis, backend, Nginx — all data directories under one path on the boot disk
- [ ] Point `STORAGE_PATH` (and the Postgres/Redis container data volumes) at directories on the existing disk — no second volume to provision
- [ ] Attach a static IP so DNS doesn't break on reboot
- [ ] In Cloudflare DNS (already the nameserver for `englishgopro.com`), add `A` records for `englishgopro.com` and `www.englishgopro.com` → the static IP; decide proxied vs. DNS-only per the table above
- [ ] Set `FRONTEND_URL=https://englishgopro.com` in the backend's `.env` (CORS) and `VITE_API_URL=https://englishgopro.com/api` in the frontend's `.env` before building
- [ ] Open ports 80/443 (and 22 for your IP only) in the Lightsail networking tab
- [ ] Set up a disk-usage alert (cron `df` check or CloudWatch-style monitoring) so you get warned before the shared disk fills up
- [ ] If proxied through Cloudflare: nothing else needed for TLS. If DNS-only: install Certbot/Let's Encrypt on the instance and set up renewal
- [ ] No automated snapshots in this option — optionally add a scheduled `pg_dump` pushed off-box if losing the database is unacceptable (video files remain unbacked-up either way)
- [ ] Set a calendar reminder to reassess storage headroom monthly — the only capacity lever here is upgrading the whole instance plan

**Option B (PaaS + R2):**
- [ ] Everything in Option A's Dockerfile step
- [ ] Rewrite `storage.service.ts` to use `@aws-sdk/client-s3` against R2's endpoint
- [ ] Update `ffmpeg.service.ts` to upload transcoded output to R2 instead of leaving it on local disk
- [ ] Point `videoUrl`/`hlsUrl` fields at R2/CDN URLs instead of local paths
- [ ] Split `index.ts` startup into two entrypoints (API server vs. queue worker) so they can run as separate Railway/Render services
- [ ] Provision Neon/Supabase Postgres, Upstash Redis, R2 bucket, Cloudflare CDN + frontend host

**Option C (AWS):**
- [ ] Same storage/worker-split changes as Option B (S3 SDK works against both R2 and S3)
- [ ] Terraform/CDK for VPC, ECS services, RDS, ElastiCache, CloudFront
- [ ] CI/CD pipeline to build + push images to ECR and deploy to ECS
- [ ] Decide self-hosted ffmpeg workers vs. MediaConvert for transcoding

---

## Notes

- Cost figures are estimates based on published provider rates as of August 2026 (Lightsail figures confirmed against AWS's current pricing page); actual costs vary with usage patterns, region, and reserved/committed-use discounts.
- Lightsail bundles a fixed data-transfer allowance into the instance price (1TB at the $5 plan up to 8TB at the $384 plan); overage is billed separately, so a bandwidth-heavy launch (lots of video streaming served directly from the instance rather than through Cloudflare's cache) could push costs above the table above — another reason to keep Cloudflare in front.
- See `CostAnalysis.md` for a broader generic AWS/GCP/Azure/Cloudflare comparison at the same Small/Medium/Growth tiers — this document layers the codebase's actual readiness on top of that comparison.
