FROM node:22.20.0-alpine3.21@sha256:b1ab5252ffe4191d7b8728606c5b943fc78d6e306950cef9963e50bcdb3c47a7
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
