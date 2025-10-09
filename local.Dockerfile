FROM node:22.20.0-alpine3.21@sha256:3bbc8aa1c0db220a63d9f42aa6e8117b305d72a6527039e99fced68c9ab96c8e
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
