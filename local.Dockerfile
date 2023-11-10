FROM arm64v8/node:18.18
ENV PORT 3000
WORKDIR /app
RUN yarn set version 1.22.17
COPY package.json yarn.lock ./
RUN yarn install
COPY . ./
RUN yarn build
CMD yarn run dev
EXPOSE $PORT
