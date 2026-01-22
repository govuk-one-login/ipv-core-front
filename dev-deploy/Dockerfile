FROM --platform=linux/arm64 node:22-alpine@sha256:42c19d60d8df0a9eaff90a0598bb575bd1dc9511b55c1d77930e4684b0774a16 AS builder
# Trigger rebuild
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

FROM --platform=linux/arm64 node:22-alpine@sha256:42c19d60d8df0a9eaff90a0598bb575bd1dc9511b55c1d77930e4684b0774a16 AS final
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