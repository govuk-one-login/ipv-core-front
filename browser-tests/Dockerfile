FROM mcr.microsoft.com/playwright:v1.56.1-jammy AS playwright

WORKDIR /browser-tests

COPY ./browser-tests/package.json ./browser-tests/package-lock.json ./browser-tests/.npmrc ./

RUN npm install

COPY ./browser-tests/data ./data
COPY ./browser-tests/functional-tests ./functional-tests
COPY ./browser-tests/snapshot-tests ./snapshot-tests
COPY ./browser-tests/playwright.config.ts ./
COPY ./browser-tests/tsconfig.json ./
COPY ../views/ipv/page ../views/ipv/page
COPY ../src/test-utils/pages-and-contexts.ts ../src/test-utils/pages-and-contexts.ts

CMD ["npm run test"]
