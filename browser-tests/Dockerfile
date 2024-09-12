FROM mcr.microsoft.com/playwright:v1.46.0-jammy AS playwright

WORKDIR /browser-tests

COPY package.json package-lock.json ./

RUN npm install

COPY . ./

CMD ["npm run test"]
