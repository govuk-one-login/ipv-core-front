FROM node:25.1.0-alpine3.21@sha256:afcd03e0c9ae83fc30d48c8f05de72938e116d83b58b8220debfd0f56aff67ae
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
