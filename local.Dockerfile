FROM arm64v8/node:18.18
ENV PORT 3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build
CMD npm run dev
EXPOSE $PORT
