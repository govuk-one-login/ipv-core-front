# E2E Playwright BDD Tests

This directory contains the **End-to-End (E2E) test suite** for IPV Core.

The tests are defined inside [Gherkin](https://cucumber.io/docs/gherkin/reference/) feature files and orchestrated with
[Playwright](https://playwright.dev/docs/writing-tests).
The [playwright-bdd](https://vitalets.github.io/playwright-bdd/#/) package is used to bridge the human-readable
Behaviour-Driven Development (BDD) scenarios defined in the Gherkin feature files to Playwright's test runner to allow
simulation of a user's full journey with IPV Core.

> For guidance on adding E2E tests, see the [guidance doc](guidance.md).

---

## 🚀 Running Tests

First, configure all environment variables by copying the `.env.template` in `/browser-tests/e2e-tests/`
and removing the `.template` extension.

Install all dependencies:

```bash
cd browser-tests/
npm install
```

To run all E2E tests, from anywhere within the `/browser-tests` directory:

```bash
npm run test:e2e
```

To run a specific feature file, specify the feature file name:

```bash
npm run test:e2e -- grep "coi-fraud-check"
```

It might be helpful for debugging to run in headed mode. To do so, add the `--headed` option:

```bash
npm run test:e2e -- grep "coi-fraud-check" --headed
```

Or, you can run the E2E tests in the Playwright UI:

```bash
npm run test:e2e-ui
```

### Behind `npm run test:e2e`

When running `npm run test:e2e`, under the hood, this runs:

```bash
npx playwright-bdd --config playwright-bdd.config.ts test && npx playwright test --config playwright-bdd.config.ts
```

This does the following:

1. `npx playwright-bdd --config playwright-bdd.config.ts test` generates `*.spec.js` files per feature file which contain
   standard `test()` calls that Playwright can execute in a `.features-gen` directory.
2. `npx playwright test --config playwright-bdd.config.ts` runs these `*.spec.js` files as normal Playwright tests

When updating a test file, you'll need to run the following from the `/browser-tests` directory again:

```bash
npx playwright-bdd --config playwright-bdd.config.ts test
```

to re-generate the `*.spec.ts` file to keep it up-to-date.

## Running in IntelliJ

- Install the IntelliJ Test Automation plugin
- Set up the `.env` file
- Open the Playwright Run Configuration and set the `Configuration file` to point at `playwright-bdd.config.ts`
  To avoid having to do this for each run configuration, set it within a template.
- Open the generated `*.spec.ts` file in `.features-gen` and click on the arrow next to the test in IntelliJ

## Debugging

Running the tests with the Playwright UI is helpful for debugging as it also displays the browser within the UI.
However, when running the tests locally, HTML test reports are also generated in `/browser-tests/e2e-tests/test-results`
along with page screenshots upon failure.

---

## 📁 Project Structure

```
e2e-tests/
├── config/               # Environment configuration and dotenv loading
├── features/             # Gherkin .feature files defining test scenarios in Given/When/Then syntax
├── fixtures/             # playwright-bdd fixtures for dependency injection into scenarios (pageUtils, criStubUtils, etc.)
├── steps/                # Step definitions (.steps.ts) that implement each Gherkin step defined in /features/*.feature
├── clients/              # API clients for external services (e.g. DCMAW Async VC enqueueing)
├── helpers/              # Standalone helpers that are not dependent on Playwright's existing fixtures/objects e.g. Page.
└── data/                 # Test data — CRI stub data configs and async DCMAW stub JSON payloads
```

1. **Feature files** (`features/*.feature`) describe user journeys in plain English using Gherkin syntax (Given/When/Then).
2. **Step definitions** (`steps/*.steps.ts`) implement each Gherkin step using Playwright actions. The `createBdd()` at
   the top of each file maps each step to a Playwright action.
3. **Fixtures** (`fixtures/index.ts`) defines common utilities dependent on Playwright objects (e.g. `Page` which allows
   browser page manipulation) to be injected and made available to the steps via `createBdd()`. This also includes the
   `ScenarioContext` which defines contexts e.g. `userId` and `oauthState` to be shared between steps in a given scenario.
4. **Helpers** (`helpers/`) define common utilities not dependent on Playwright objects and can be called anywhere in the
   code.
5. **Clients** (`clients/`) handle external API interactions needed during tests (e.g. enqueuing async VCs). These
   are not dependent on any Playwright objects.
6. **Data** (`data/`) holds test persona configurations and stub payloads used by fixtures and clients.
