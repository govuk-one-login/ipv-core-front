FROM node:18.2.0-alpine3.15@sha256:0677e437543d10f6cb050d92c792a14e5eb84340e3d5b4c25a88baa723d8a4ae AS builder

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

FROM node:18.2.0-alpine3.15@sha256:0677e437543d10f6cb050d92c792a14e5eb84340e3d5b4c25a88baa723d8a4ae as final

RUN ["apk", "--no-cache", "upgrade"]
RUN ["apk", "add", "--no-cache", "tini"]
RUN [ "yarn", "set", "version", "1.22.17" ]

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
