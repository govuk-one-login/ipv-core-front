FROM mcr.microsoft.com/playwright:v1.46.0-jammy as playwright

WORKDIR /test

COPY package.json package-lock.json ./

RUN npm install

COPY . ./

CMD ["./run-tests.sh"]
