FROM node:24.22.2-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
