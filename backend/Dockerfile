# EnglishGoPro backend — Express API + BullMQ transcode worker in one process.
#
# Built by CI for linux/amd64 (see .github/workflows/build-images.yml) and
# pulled by the Lightsail host. Never built on the server itself.

# ---- build stage -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Prisma client must be generated before tsc, or the build fails on missing
# types from @prisma/client.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage -----------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# ffmpeg + ffprobe for transcoding; openssl is required by Prisma's query engine
# on musl. ffmpeg.service.ts derives the ffprobe path by stripping "/ffmpeg" off
# FFMPEG_PATH, so /usr/bin/ffmpeg -> /usr/bin/ffprobe resolves correctly.
RUN apk add --no-cache ffmpeg openssl

ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg

COPY package*.json ./
RUN npm ci --omit=dev

# `prisma` is a runtime dependency, so `npx prisma migrate deploy` works in this
# image. Migrations ship here too, which is why the host needs no repo source.
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/index.js"]
