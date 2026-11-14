FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps ./apps
COPY services ./services
COPY scripts ./scripts
COPY tests ./tests
RUN mkdir -p /app/data && chown -R node:node /app

FROM base AS runtime
USER node
CMD ["node", "apps/gateway/server.mjs"]

FROM base AS dashboard
RUN npm run build
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start"]
