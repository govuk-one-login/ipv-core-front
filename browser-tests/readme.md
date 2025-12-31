# Browser Tests

This folder contains browser-based E2E tests using **Playwright BDD** framework.

The tests run core front against a browser using Playwright and a fake core back provided by imposter. Tests are written in Gherkin (feature files) with step definitions in TypeScript.

## Quick Start

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --headed        # Run with visible browser
npm test -- --debug         # Debug mode
npm test -- --project=chromium  # Specific browser
```

## Test Structure (Playwright BDD)

Tests are organized as:
- **Feature Files** (`.feature`) - Business-readable scenarios in Gherkin
- **Step Definitions** (`.steps.ts`) - TypeScript implementation of steps
- **Pages** (POM) - Page Object Model classes for UI interactions
- **Services** - Business logic and API interactions

For detailed migration information, see [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) or [BEFORE_AND_AFTER.md](./BEFORE_AND_AFTER.md).

## Running Tests with Docker

This will run the tests in the same way as in the build pipeline:
- Build the docker containers `docker compose build`
- Run the tests `docker compose up --exit-code-from browser-tests-tests`
- If you get test failures you may need to disconnect from the VPN and try again

## Functional Tests

### Journeys
Each test can have its own journey configured in `imposter/config/api-config.yaml`. The `state` value passed to the authorise URL at the start of a journey will be returned by imposter as the `IpvSessionId`. The `IpvSessionId` will then be passed back to imposter for each core-back request, so imposter can select its response based on the `IpvSessionId` value.

### Running Tests in IntelliJ
- Install the IntelliJ Test Automation plugin
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- Optionally disable headless mode in `playwright.config.ts` so you can see what's happening
- Set up environment variables as in the `browser-tests-tests` container setup
- Click on the arrow next to the test in IntelliJ

### Debugging Core Front During Tests
- Build the docker containers `docker compose build`
- Run the imposter and core-front containers in one terminal `docker compose up browser-tests-core-back-imposter browser-tests-core-front`
- Set up environment variables as in the `browser-tests-tests` container setup
- Attach IntelliJ to core front on localhost port 5101
- Run the tests in Playwright's UI from another terminal `WEBSITE_HOST="http://localhost:4601" npx playwright test --ui`

## Snapshot Tests
These tests call the dev template display URL with different languages and contexts and compare screenshots of the displayed page. As such there shouldn't be much need to debug them, but if it is necessary it can be done similarly to the functional tests above. Be aware that when running the snapshot tests locally you will be using the browser on your machine instead of the browser in the test container and so subtle differences could appear and the snapshot files generated will be named differently.

### Updating Snapshots
If you make a change that affects the appearance of a page then you will need to update the saved snapshot file:
```bash
npm run update-snapshots
```

Or with Docker:
```bash
docker compose build
NPM_COMMAND=update-snapshots docker compose up --exit-code-from browser-tests-tests
```

## Documentation

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick syntax reference and patterns
- **[BEFORE_AND_AFTER.md](./BEFORE_AND_AFTER.md)** - Comparison of traditional Playwright vs BDD
- **[e2e-tests/BDD_MIGRATION.md](./e2e-tests/BDD_MIGRATION.md)** - Complete migration guide
- **[e2e-tests/CONVERSION_GUIDE.md](./e2e-tests/CONVERSION_GUIDE.md)** - How to convert more tests
- **[CHECKLIST.md](./CHECKLIST.md)** - Post-migration tasks
- **[MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)** - Summary of changes

## Ports
- 4601 - Core front
- 4602 - Core back imposter
- 5101 - Core front debug port

