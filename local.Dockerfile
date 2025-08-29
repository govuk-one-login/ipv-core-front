FROM node:22.19.0-alpine3.21@sha256:7f48a7dfe3e895f5fabff082463e316d56f35f07005ca0d9ebacdc92ddf2b883
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
