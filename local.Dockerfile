FROM node:24.0.2-alpine3.21@sha256:2e6c7937cb36d1e4af3c261b29e862205beb7a409de01f12b6df34800cc108ec
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
