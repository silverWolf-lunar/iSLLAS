FROM node:20-bookworm-slim AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/worker apps/worker
COPY packages/contracts packages/contracts
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sllas/worker... build

FROM node:20-bookworm-slim AS runtime

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY --from=build /workspace/apps/worker/dist apps/worker/dist
COPY packages/contracts/package.json packages/contracts/package.json
COPY --from=build /workspace/packages/contracts/dist packages/contracts/dist
RUN pnpm install --prod --filter @sllas/worker... --frozen-lockfile

ENV NODE_ENV=production
USER node
CMD ["node", "apps/worker/dist/main.js"]
