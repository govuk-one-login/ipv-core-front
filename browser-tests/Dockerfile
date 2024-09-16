FROM mcr.microsoft.com/playwright:v1.46.0-jammy AS playwright

WORKDIR /browser-tests

COPY ./browser-tests/package.json ./browser-tests/package-lock.json ./

RUN npm install

COPY ./browser-tests/data ./data
COPY ./browser-tests/functional-tests ./functional-tests
COPY ./browser-tests/snapshot-tests ./snapshot-tests
COPY ./browser-tests/playwright.config.js ./
COPY ../src/views/ipv/page ../src/views/ipv/page

CMD ["npm run test"]
