FROM arm64v8/node@sha256:feb4d8bbc80e1a369e394588e17d03b7a359f33fe0e597820e0d64cc9e723e74 AS builder
WORKDIR /app
COPY /src ./src
COPY package.json ./
COPY package-lock.json ./

RUN npm install
RUN npm run build

# 'npm install --omit=dev' does not prune test packages which are necessary
RUN npm install --omit=dev

FROM arm64v8/node@sha256:feb4d8bbc80e1a369e394588e17d03b7a359f33fe0e597820e0d64cc9e723e74 as final
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

# Add in dynatrace layer
COPY --from=khw46367.live.dynatrace.com/linux/oneagent-codemodules-musl:nodejs / /
ENV LD_PRELOAD /opt/dynatrace/oneagent/agent/lib64/liboneagentproc.so

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
