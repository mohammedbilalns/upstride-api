# -----------------------
# 1. Build Stage
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN NODE_OPTIONS="--max-old-space-size=768" pnpm run build


# -----------------------
# 2. Production Stage
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

COPY package.json pnpm-lock.yaml ./

# Install ONLY production deps
ENV HUSKY=0
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/dist ./dist

# Logs dir
RUN mkdir -p /app/logs && chown -R app:app /app

USER app

EXPOSE 8000

CMD ["pnpm", "run", "start"]
