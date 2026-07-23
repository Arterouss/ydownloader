FROM node:20-slim AS base

# ------- Dependencies stage -------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ------- Build stage -------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ------- Production stage -------
FROM base AS runner

# Install system dependencies: yt-dlp, ffmpeg, python3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure yt-dlp to use Node.js as JS runtime
RUN mkdir -p /root/.config/yt-dlp && \
    echo "--js-runtimes node" > /root/.config/yt-dlp/config

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
