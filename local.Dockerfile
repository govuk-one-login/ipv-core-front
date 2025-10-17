FROM node:25.0.0-alpine3.21@sha256:1c66cb8e1a58309a1be03f3752bfc4a98aafa9f822e3fb003c5c97f7c2d1edd4
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
