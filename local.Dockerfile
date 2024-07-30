FROM node:node:20.11.1-alpine3.19
ENV PORT 4501
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
CMD npm run dev
EXPOSE $PORT
