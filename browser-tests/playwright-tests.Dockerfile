FROM mcr.microsoft.com/playwright:v1.64.1-noble AS playwright

ADD "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" "awscliv2.zip"

RUN apt update \
    && apt install -y unzip jq curl \
    && unzip awscliv2.zip && ./aws/install \
    && apt-get clean

WORKDIR /browser-tests

COPY ./browser-tests/package.json ./browser-tests/package-lock.json ./browser-tests/.npmrc ./

RUN npm install

COPY ./browser-tests/data ./data
COPY ./browser-tests/e2e-tests ./e2e-tests
COPY ./browser-tests/playwright-bdd.config.ts ./
COPY ./browser-tests/tsconfig.json ./

WORKDIR /
COPY /browser-tests/e2e-tests/run-tests.sh /
ENTRYPOINT ["/run-tests.sh"]
