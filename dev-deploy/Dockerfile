FROM node:18.16.0-alpine@sha256:44aaf1ccc80eaed6572a0f2ef7d6b5a2982d54481e4255480041ac92221e2f11 AS builder
WORKDIR /app
COPY /src ./src
COPY package.json ./
COPY package-lock.json ./

RUN npm install
RUN npm run build

# 'npm install --omit=dev' does not prune test packages which are necessary
# to build the app. So delete nod_modules and reinstall only production packages.
RUN [ "rm", "-rf", "node_modules" ]
RUN npm install --omit=dev

FROM node:18.16.0-alpine@sha256:44aaf1ccc80eaed6572a0f2ef7d6b5a2982d54481e4255480041ac92221e2f11 as final
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN ["apk", "--no-cache", "upgrade"]
RUN ["apk", "add", "--no-cache", "tini"]
USER appuser:appgroup

WORKDIR /app
# Copy in compile assets and deps from build container
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/src ./src
COPY --chown=appuser:appgroup --from=builder /app/package.json ./
COPY --chown=appuser:appgroup --from=builder /app/package-lock.json ./

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
