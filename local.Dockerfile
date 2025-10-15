FROM node:22.20.0-alpine3.21@sha256:f40aebdd0c1959821ab6d72daecafb2cd1d4c9a958e9952c1d71b84d4458f875
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm run build-service-unavailable
CMD npm run dev
EXPOSE $PORT
