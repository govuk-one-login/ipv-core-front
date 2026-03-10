# Snapshot Tests
These tests call the dev template display URL with different languages and contexts and compare screenshots of the
displayed page. As such there shouldn't be much need to debug them, but if it is necessary it can be done similarly to
the [functional tests](../functional-tests/readme.md#debugging-core-front-during-tests).

Be aware that when running the snapshot tests locally you will be using the browser on your machine instead of the browser
in the test container and so subtle differences could appear and the snapshot files generated will be named differently.

## Running Tests
To run the snapshot tests (along with the functional tests) in Docker:
```bash
npm run test:functional-docker
```

Before running the snapshot tests locally, the Core Front and Core Back imposter containers need to be spun up:
```bash
docker compose build && docker compose up browser-tests-core-back-imposter browser-tests-core-front
```

To run them locally:
```bash
npx playwright test --config playwright.config.ts
```

To run them with Intellij or Playwright UI, instructions are the same as the [functional tests](../functional-tests/readme.md#running-playwright-tests-in-intellij).

## Updating Snapshots
If you make a change that affects the appearance of a page then you will need to update the saved snapshot file:
```bash
npm run update-snapshots
```
Or to run within a Docker container:
```bash
npm run test:update-snapshots-docker
```
