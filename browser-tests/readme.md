# Browser tests

These tests run core front against a browser using Playwright and a fake core back provided by imposter.

## Journeys
Each test can have its own journey configured in `imposter/config/api-config.yaml`. The `state` value passed to the authorise URL at the start of a journey will be returned by imposter as the `IpvSessionId`. The `IpvSessionId` will then be passed back to imposter for each core-back request, so imposter can select its response based on the `IpvSessionId` value.

## Running Playwright tests in IntelliJ
- Install the IntelliJ Test Automation plugin
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers `docker compose up browser-tests-core-front`
- Optionally disable headless mode in `playwright.config.js` so you can see what happening
- Click on the arrow next to the test in IntelliJ

## Running all the Playwright tests
- Build the docker containers `docker compose build`
- Run the tests `docker compose up --exit-code-from browser-tests-tests`

## Debugging core front during tests
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers in one terminal `docker compose up browser-tests-core-front`
- Attach IntelliJ to core front on localhost port 5101
- Run the tests in another terminal `docker compose up browser-tests-tests`

## Ports
4601 core front
4602 core back imposter
5101 core front debug port
