FROM node:18.6.0-alpine3.15@sha256:4203fefa49002c75075c1fc389a0655cc7cad21ad4e9d746f3f6f30deb2c950d AS builder
WORKDIR /app
RUN [ "yarn", "set", "version", "1.22.17" ]
COPY /src ./src
COPY package.json ./
COPY yarn.lock ./

RUN yarn install
RUN yarn build

# 'yarn install --production' does not prune test packages which are necessary
# to build the app. So delete nod_modules and reinstall only production packages.
RUN [ "rm", "-rf", "node_modules" ]
RUN yarn install --production

FROM node:18.6.0-alpine3.15@sha256:4203fefa49002c75075c1fc389a0655cc7cad21ad4e9d746f3f6f30deb2c950d as final
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN ["apk", "--no-cache", "upgrade"]
RUN ["apk", "add", "--no-cache", "tini"]
RUN ["yarn", "set", "version", "1.22.17" ]
USER appuser:appgroup

WORKDIR /app
# Copy in compile assets and deps from build container
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/src ./src
COPY --chown=appuser:appgroup --from=builder /app/package.json ./
COPY --chown=appuser:appgroup --from=builder /app/yarn.lock ./

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["tini", "--"]

CMD ["yarn", "start"]
