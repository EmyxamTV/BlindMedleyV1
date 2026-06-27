FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false
ENV UPDATENOTIFIER=false
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app

ARG APP_VERSION
ENV NODE_ENV=production
ENV APP_VERSION=${APP_VERSION}

COPY --from=builder /app/build ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
    && mkdir -p tmp
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["/app/docker-entrypoint.sh"]
