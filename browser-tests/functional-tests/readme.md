# Functional Tests

The functional tests run Core Front against a browser using Playwright and a fake Core Back provided by imposter.

## Journeys

Core Back responses are mocked using imposter and configured in `/browser-tests/imposter/config/api-config.yaml`. Imposter
will match a request from Core Front to Core Back by finding a matching request within the `api-config.yaml` file.

The `state` value passed to the authorise URL at the start of a journey will be returned by imposter as the `IpvSessionId`.
The `IpvSessionId` will then be passed back to imposter for each core-back request, so imposter can select its response
based on the `IpvSessionId` value.

## Running Tests

All the functional tests can be run within Docker with:

```bash
npm run test:functional-docker
```

### Running Playwright tests in IntelliJ

- Install the IntelliJ Test Automation plugin
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- Optionally disable headless mode in `playwright.config.ts` so you can see what's happening
- Set up environment variables as in the `browser-tests-tests` container setup
- Click on the arrow next to the test in IntelliJ

### Running Playwright tests in the Playwright runner

- Build the docker containers `docker compose build`
- Run the imposter and core-front containers `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- `npx playwright test --ui`
- Or `npx playwright test --ui --headed` to see the browser as the test runs

### Debugging core front during tests

- Build the docker containers `docker compose build`
- Run the imposter and core-front containers in one terminal `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- Set up environment variables as in the `browser-tests-tests` container setup
- Attach IntelliJ to core front on localhost port 5101
- Run the tests in Playwright's UI from another terminal `WEBSITE_HOST="http://localhost:4601" npx playwright test --ui`
