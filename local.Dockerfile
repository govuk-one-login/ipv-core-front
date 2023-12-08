FROM node:18.16.0-alpine
ENV PORT 3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
CMD npm run dev
EXPOSE $PORT
