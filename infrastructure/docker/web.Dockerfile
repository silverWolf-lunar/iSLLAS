FROM node:20-bookworm-slim AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web apps/web
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sllas/web... build

FROM node:20-bookworm-slim AS runtime

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web/next.config.mjs apps/web/next.config.mjs
COPY --from=build /workspace/apps/web/.next apps/web/.next
COPY packages/contracts/package.json packages/contracts/package.json
COPY --from=build /workspace/packages/contracts/dist packages/contracts/dist
COPY packages/validation/package.json packages/validation/package.json
COPY --from=build /workspace/packages/validation/dist packages/validation/dist
COPY packages/design-tokens/package.json packages/design-tokens/package.json
COPY --from=build /workspace/packages/design-tokens/dist packages/design-tokens/dist
COPY packages/api-client/package.json packages/api-client/package.json
COPY --from=build /workspace/packages/api-client/dist packages/api-client/dist
RUN pnpm install --prod --filter @sllas/web... --frozen-lockfile

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
USER node
CMD ["pnpm", "--filter", "@sllas/web", "start"]
