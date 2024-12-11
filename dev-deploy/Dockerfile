FROM --platform="linux/arm64" arm64v8/node@sha256:b16c4e21f9e9e4d02c226d7b2dde3283fc9315104b66009af546b50f5c7acad4 AS builder
WORKDIR /app

# Install packages
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./
RUN npm install

# Build assets
COPY /assets ./assets
RUN npm run build

# Build code
COPY /src ./src
COPY /locales ./locales
COPY /views ./views
COPY tsconfig.json ./
RUN npm run tsc

# 'npm install --omit=dev' does not prune test packages which are necessary
RUN npm install --omit=dev

FROM --platform="linux/arm64" arm64v8/node@sha256:b16c4e21f9e9e4d02c226d7b2dde3283fc9315104b66009af546b50f5c7acad4 as final
#RUN addgroup -S appgroup && adduser -S appuser -G appgroup


RUN ["apt-get", "update"]
RUN ["apt-get", "install", "-y", "tini"]

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
