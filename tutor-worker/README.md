# EnglishGoPro AI tutor (Cloudflare Worker)

Serves `POST https://englishgopro.com/api/tutor`, the chat endpoint behind the
"Ask the AI tutor" widget on student pages. It runs on Cloudflare in front of
the origin: only `/api/tutor*` is routed here, every other `/api` path still
reaches the backend.

```
Browser (TutorChat widget) ──POST /api/tutor──▶ Worker ──▶ Workers AI (@cf/zai-org/glm-4.7-flash)
        ◀──────── text/event-stream ───────────┘
```

Per request the Worker:

1. Verifies the student's access token (HS256, same `JWT_SECRET` as the backend).
2. Rate-limits per user (8 messages / minute, `TUTOR_LIMITER` in `wrangler.jsonc`).
3. Validates and caps the conversation (last 12 turns, 1,500 chars per message).
4. Builds the tutor system prompt (`src/prompt.ts`) with the current lesson
   title, course, and description, and the site language (`en` or `zh`,
   explanations in Traditional Chinese).
5. Streams the reply as `data: {"delta":"..."}` events ending with `data: [DONE]`.
   Model reasoning text is dropped.

## Cost

Workers AI includes 10,000 Neurons per day free on every plan. On the free
Workers plan, requests fail once that is used up, and the widget shows "The
tutor is resting right now" until the next UTC day. See
https://developers.cloudflare.com/workers-ai/platform/pricing/ for current
per-model prices.

## Setup

```sh
cd tutor-worker
npm install
npx wrangler login
npx wrangler secret put JWT_SECRET   # paste the backend's JWT_SECRET
npm run deploy
```

`JWT_SECRET` must match `backend/.env.production`. If the backend secret is
rotated, update the Worker secret too, or students get "Please log in again".

## Develop

```sh
npm test            # unit tests (no Cloudflare account needed)
npm run typecheck
npm run dev         # wrangler dev --remote: real Workers AI, uses your account's allowance
```

For `npm run dev`, put a local secret in `.dev.vars` (git-ignored):

```
JWT_SECRET=<your local backend's JWT_SECRET>
```

and point the frontend at it with `VITE_TUTOR_URL=http://localhost:8787/api/tutor`
in `frontend/.env.local`.

## Change the tutor

- Behaviour and tone: `src/prompt.ts`
- Model: `TUTOR_MODEL` in `wrangler.jsonc` (any Workers AI chat model)
- Limits: `src/request.ts` (`LIMITS`) and `ratelimits` in `wrangler.jsonc`
