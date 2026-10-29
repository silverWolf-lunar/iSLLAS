FROM node:20-bookworm-slim AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api apps/api
COPY packages packages
COPY database database
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sllas/api... build

FROM build AS migrate
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@sllas/api", "migration:run"]

FROM node:20-bookworm-slim AS runtime

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY --from=build /workspace/apps/api/dist apps/api/dist
COPY packages/contracts/package.json packages/contracts/package.json
COPY --from=build /workspace/packages/contracts/dist packages/contracts/dist
COPY packages/validation/package.json packages/validation/package.json
COPY --from=build /workspace/packages/validation/dist packages/validation/dist
COPY packages/config/package.json packages/config/package.json
COPY --from=build /workspace/packages/config/dist packages/config/dist
RUN pnpm install --prod --filter @sllas/api... --frozen-lockfile

ENV NODE_ENV=production
EXPOSE 3001
USER node
CMD ["node", "apps/api/dist/main.js"]
