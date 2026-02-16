# E2E Playwright BDD Tests

This directory contains the **End-to-End (E2E) test suite** for the **IPV Core Front** application, built using **[playwright-bdd](https://github.com/vitalets/playwright-bdd)**, **Playwright**, and **TypeScript**. Tests are written as **Gherkin feature files** with step definitions, following a **Behaviour-Driven Development (BDD)** approach to simulate full user journeys across multiple services and stubs.

> 📘 See also: [`browser-tests/QUICK_REFERENCE.md`](../QUICK_REFERENCE.md) for a handy cheat-sheet of common commands and patterns.

---

## 📁 Project Structure

The framework is structured using the **Page Object Model (POM)**, **Gherkin feature files**, and custom **fixtures** to ensure tests are readable, scalable, and easy to maintain.

```
e2e-tests/
├── config/               # Handles test configuration and environment variables (ConfigurationReader).
├── features/             # Gherkin .feature files defining test scenarios in plain English.
│   ├── coi-fraud-check.feature
│   ├── e2e-passport.feature
│   ├── f2f-passport.feature
│   └── strategicApp.feature
├── fixtures/             # Custom Playwright BDD fixtures for dependency injection (page objects).
├── pages/                # Page Object classes that encapsulate UI locators and interactions.
├── services/             # Services for handling API requests (ApiService, DcmawAsyncService).
├── steps/                # BDD step definitions (.steps.ts) mapped to Gherkin steps.
│   ├── bdd-context.ts
│   ├── common.steps.ts
│   ├── coi-fraud-check.steps.ts
│   ├── e2e-passport.steps.ts
│   ├── f2f-passport.steps.ts
│   └── strategicApp.steps.ts
└── types/                # TypeScript type definitions for test data.
```

### 🔄 How BDD Tests Work

1. **Feature files** (`features/*.feature`) describe scenarios in Gherkin syntax (Given/When/Then).
2. **Step definitions** (`steps/*.steps.ts`) implement each Gherkin step using Playwright actions.
3. **Fixtures** (`fixtures/bdd-fixtures.ts`) inject page objects into steps via `playwright-bdd`.
4. **`playwright-bdd`** auto-generates Playwright spec files into `.features-gen/` at build time.
5. **Playwright** then runs the generated specs as normal tests.

---

## ⚙️ Local Configuration

To run the tests locally, you need to create a `.env` file in the root of the `browser-tests/` directory. This file stores environment-specific URLs and API keys, keeping them separate from the codebase.

### Steps:
1. Create a file named `.env` in the `browser-tests/` directory.
2. Add the required environment variables (see below).

### Example `.env` file:

```env
# ── Required (tests will fail without these) ──────────────────────────
ORCHESTRATOR_STUB_URL="https://your-orchestrator-stub-url"
TICF_MANAGEMENT_API_KEY="your-api-key"

# ── Optional (sensible defaults are provided) ─────────────────────────
# IDENTITY_BUILD_URL="https://identity.build.account.gov.uk"
# TICF_MANAGEMENT_URL="https://ticf.stubs.account.gov.uk/management/user"
# FEATURE_FLAGS="ticfCriBeta,disableStrategicApp"
# BROWSER="chromium"
# TEST_TIMEOUT="90000"
# HEADLESS="true"
# BASE_URL="https://identity.build.account.gov.uk"
# WEBSITE_HOST="http://localhost:4601"
```

---

## 🚀 Running Tests

Make sure all dependencies are installed first:

```bash
cd browser-tests
npm install
```

> ⚠️ Run `npm install` from the `browser-tests/` directory — that's where the `package.json` lives. All test commands below should also be run from `browser-tests/`.

### ▶️ Run All E2E BDD Tests

This generates the Playwright specs from the Gherkin feature files and then executes them:

```bash
npm run test:e2e
```

Under the hood this runs:
```bash
npx playwright-bdd --config playwright-bdd.config.ts test && npx playwright test --config playwright-bdd.config.ts
```

### 🎯 Run a Specific Feature File

First generate the specs, then target the generated file by feature name:

```bash
# Generate specs from feature files
npx playwright-bdd --config playwright-bdd.config.ts test

# Run a specific feature (use grep to match the feature/scenario name)
npx playwright test --config playwright-bdd.config.ts --grep "e2e-passport"
```

### 🖥️ Run in Headed Mode (See the Browser)

```bash
npx playwright-bdd --config playwright-bdd.config.ts test
npx playwright test --config playwright-bdd.config.ts --headed
```

### 🐛 Run in UI Mode (Recommended for Debugging)

Playwright's interactive UI mode lets you step through tests, inspect the DOM, and view traces:

```bash
npx playwright-bdd --config playwright-bdd.config.ts test
npx playwright test --config playwright-bdd.config.ts --ui
```

### 🤖 Run All Tests (Functional + E2E)

This runs both the functional/snapshot tests and the E2E BDD tests:

```bash
npm run test:all
```

### 📸 Update Snapshots (Functional Tests Only)

```bash
npm run update-snapshots
```

---

## 🧩 Available npm Scripts

| Script                   | Description                                              |
|--------------------------|----------------------------------------------------------|
| `npm test`               | Runs functional/snapshot tests (`playwright.config.ts`)  |
| `npm run test:e2e`       | Generates BDD specs and runs E2E tests                   |
| `npm run test:all`       | Runs both functional and E2E tests                       |
| `npm run update-snapshots` | Updates visual snapshots for functional tests          |

---

## 📝 Writing New Tests

1. **Create a feature file** in `features/` using Gherkin syntax:
   ```gherkin
   Feature: My new journey

     Scenario: User completes the journey
       Given the user starts on the orchestrator stub
       When they complete the identity check
       Then they should see the success page
   ```

2. **Add step definitions** in `steps/my-feature.steps.ts`, importing fixtures from `fixtures/bdd-fixtures.ts`.

3. **Create page objects** in `pages/` if new pages are involved, following the existing POM pattern.

4. **Run the tests** — `playwright-bdd` will auto-generate the Playwright specs from your feature files.
