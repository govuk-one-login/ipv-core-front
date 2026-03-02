# Browser Tests

This folder contains the **functional tests**, **snapshot tests** and **E2E tests**.
* The functional tests are integration tests which tests core-front against a mock of IPV Core Back.
* The snapshot tests captures and compares visual snapshots of IPV Core's pages and checks for any changes from a base image.
* The E2E tests simulate different user journeys in a browser from the orch stub, therefore, testing the entirety of IPV Core's stack, not
just Core Front.

For more information on each test suite, see their documentation:
* [E2E tests](e2e-tests/readme.md)
* [Functional tests](functional-tests/readme.md)
* [Snapshot tests](snapshot-tests/readme.md)

---

## Quick Start

### Installation
```bash
cd browser-tests/
npm install
```

### Running Tests
There are various scripts to run the tests, defined in `package.json`:

| Script                         | Description                                                                                                                                                                                     |
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `test:all`                     | Runs both the functional and E2E tests one after the other.                                                                                                                                     |
| `test:update-snapshots-docker` | Runs the snapshot tests and replaces the base image of any updated pages. This spins up Docker containers running Core Front, a mock of Core Back and the tests.                                |
| `update-snapshots`             | Runs the snapshot tests locally and replaces the base image of any updated pages. Before running this script, the containers must be spun up with `docker compose build && docker compose up`.  |
| `test:functional-docker`       | Runs just the functional and snapshot tests. This spins up docker containers running Core Front, a mock of Core Back and another container running the tests.                                   |
| `test:e2e` | Runs just the E2E tests locally.                                                                                                                                                                |
| `test:e2e-ui` | Opens the Playwright Runner so the tests can be ran with the UI. Helpful for debugging.                                                                                                         |


To run a script:
```bash
npm run <script>
```

If you get test failures you may need to disconnect from the VPN and try again.

### Running Functional and Snapshot Playwright Tests Locally
These need the containers defined in `compose.yaml` to be spun up before running the Playwright tests locally:
```bash
docker compose build && docker compose up browser-tests-core-back-imposter browser-tests-core-front
```
The ports used are:
- 4601 - Core Front
- 4602 - Core Back imposter
- 5101 - Core Front debug port
