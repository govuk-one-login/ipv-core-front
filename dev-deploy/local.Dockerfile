FROM node:22.16.0-alpine3.21@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca AS builder
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

FROM node:22.14.0-alpine3.21@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS final
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

ENV PORT=8080

HEALTHCHECK --interval=5s --timeout=2s --retries=10 \
  CMD curl -f http://localhost:8080/healthcheck || exit 1

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "export DT_HOST_ID=CORE-FRONT-$RANDOM && tini npm start"]