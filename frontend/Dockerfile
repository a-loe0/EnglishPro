# EnglishGoPro frontend — Vite/React SPA served by nginx, which also reverse-
# proxies /api to the backend container.
#
# This nginx never binds a host port. Caddy (the incumbent stack's, holding
# 80/443) proxies to it over the shared worldview_default network.

# ---- build stage -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_* values are compiled into the bundle and CANNOT be changed at runtime.
# CI supplies this from the workflow matrix; a local build must pass
# --build-arg VITE_API_URL=... or the app will call localhost:8000.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime stage -----------------------------------------------------------
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
