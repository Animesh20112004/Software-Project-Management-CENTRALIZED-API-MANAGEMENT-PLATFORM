FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node apps ./apps
COPY --chown=node:node services ./services
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node tests ./tests
RUN mkdir -p /app/data && chown -R node:node /app
USER node
CMD ["node", "apps/gateway/server.mjs"]

FROM runtime AS dashboard
RUN npm run build
ENV NODE_ENV=production
CMD ["node", "node_modules/next/dist/bin/next", "start", "apps/dashboard", "--hostname", "0.0.0.0", "--port", "3000"]
