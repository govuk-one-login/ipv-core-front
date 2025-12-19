# Browser tests

This folder contains two types of tests; functional tests and snapshot tests.
The functional tests run core front against a browser using Playwright and a fake core back provided by imposter.
The snapshot tests only call the dev template display URL so don't use imposter.

## Running all the Playwright tests
This will run the tests in the same way as in the build pipeline
- Build the docker containers `docker compose build`
- Run the tests `docker compose up --exit-code-from browser-tests-tests`
- If you get test failures you may need to disconnect from the VPN and try again

## Functional tests

### Journeys
Each test can have its own journey configured in `imposter/config/api-config.yaml`. The `state` value passed to the authorise URL at the start of a journey will be returned by imposter as the `IpvSessionId`. The `IpvSessionId` will then be passed back to imposter for each core-back request, so imposter can select its response based on the `IpvSessionId` value.

### Running Playwright tests in IntelliJ
- Install the IntelliJ Test Automation plugin
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- Optionally disable headless mode in `playwright.config.ts` so you can see what happening
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

## Snapshot tests
These tests just call the dev template display URL with different languages and contexts and compare screenshots of the
displayed page. As such there shouldn't be much need to debug them, but if it is necessary it can be done similarly to
the functional tests above. Be aware that when running the snapshot tests locally you will be using the browser on your
machine instead of the browser in the test container and so subtle differences could appear and the snapshot files
generated will be named differently.

### Updating snapshots
If you make a change that affects the appearance of a page then you will need to update the saved snapshot file.
- `docker compose build`
- `NPM_COMMAND=update-snapshots docker compose up --exit-code-from browser-tests-tests`

## Ports
4601 core front
4602 core back imposter
5101 core front debug port
