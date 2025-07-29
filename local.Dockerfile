FROM node:22.17.1-alpine3.21@sha256:f00440c423ce5657e4d2347fa3b9bf5887389f6fcf3daa25cc79ea11a6a00f80
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
