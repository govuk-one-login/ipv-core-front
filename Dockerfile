FROM node:16.13.1-alpine3.15@sha256:a2c7f8ebdec79619fba306cec38150db44a45b48380d09603d3602139c5a5f92 AS builder
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

WORKDIR /app
RUN [ "yarn", "set", "version", "1.22.17" ]
COPY --chown=appuser:appgroup  /src ./src
COPY --chown=appuser:appgroup  package.json ./
COPY --chown=appuser:appgroup  yarn.lock ./

RUN yarn install
RUN yarn build

# 'yarn install --production' does not prune test packages which are necessary
# to build the app. So delete nod_modules and reinstall only production packages.
RUN [ "rm", "-rf", "node_modules" ]
RUN yarn install --production

FROM node:16.13.1-alpine3.15@sha256:a2c7f8ebdec79619fba306cec38150db44a45b48380d09603d3602139c5a5f92 as final
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN ["apk", "--no-cache", "upgrade"]
RUN ["apk", "add", "--no-cache", "tini"]
RUN ["yarn", "set", "version", "1.22.17" ]
USER appuser:appgroup

WORKDIR /app
# Copy in compile assets and deps from build container
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["yarn", "start"]
