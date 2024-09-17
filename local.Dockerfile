FROM node:22.8.0-alpine3.19@sha256:3cb4748ed93c45cf4622c3382a5ce063af1fcbc5f3da6d2b669352ebace9f76d
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
CMD npm run dev
EXPOSE $PORT
