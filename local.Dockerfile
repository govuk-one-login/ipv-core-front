FROM node:22.18.0-alpine3.21@sha256:2286e35d4e89a5424327b9bf9fcb1f85899dcfdcc92141b6d56d2ddb2fc0182b
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
