FROM node:24.0.1-alpine3.21@sha256:37712740dc486f179b9540be1c6703cef3f805ea932573a007db748b71189afe
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
