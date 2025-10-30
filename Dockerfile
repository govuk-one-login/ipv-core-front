FROM node:25.1.0-alpine3.21@sha256:afcd03e0c9ae83fc30d48c8f05de72938e116d83b58b8220debfd0f56aff67ae AS builder
WORKDIR /app

# Install packages
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./
RUN npm install

# Get assets
COPY /assets ./assets
RUN npm run build

# Get build scripts
COPY /build-scripts ./build-scripts

# Compile TS and build code
COPY /src ./src
COPY /locales ./locales
COPY /views ./views
COPY tsconfig.json ./
RUN npm run tsc
RUN npm run build-service-unavailable

# 'npm install --omit=dev' does not prune test packages which are necessary
RUN npm install --omit=dev

FROM node:25.1.0-alpine3.21@sha256:afcd03e0c9ae83fc30d48c8f05de72938e116d83b58b8220debfd0f56aff67ae AS final
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN ["apk", "--no-cache", "upgrade"]
RUN ["apk", "add", "--no-cache", "tini", "curl"]
USER appuser:appgroup

WORKDIR /app
# Copy in compile assets and deps from build container
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/build ./build
COPY --chown=appuser:appgroup --from=builder /app/locales ./locales
COPY --chown=appuser:appgroup --from=builder /app/views ./views
COPY --chown=appuser:appgroup --from=builder /app/package.json ./
COPY --chown=appuser:appgroup --from=builder /app/package-lock.json ./

# Add in dynatrace layer
COPY --from=khw46367.live.dynatrace.com/linux/oneagent-codemodules-musl:nodejs / /
ENV LD_PRELOAD /opt/dynatrace/oneagent/agent/lib64/liboneagentproc.so

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "export DT_HOST_ID=CORE-FRONT-$RANDOM && tini npm start"]
