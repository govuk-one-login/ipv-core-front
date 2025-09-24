# E2E Playwright Tests

This directory contains the **End-to-End (E2E) test suite** for the **IPV Core Front** application, built using **Playwright** and **TypeScript**. These tests are designed to simulate full user journeys across multiple services and stubs.

---

## 📁 Project Structure

The framework is structured using the **Page Object Model (POM)** and custom **fixtures** to ensure tests are readable, scalable, and easy to maintain.

e2e-tests/
├── config/             # Handles test configuration and environment variables.
├── fixtures/           # Custom Playwright fixtures for dependency injection (e.g., page objects).
├── pages/              # Page Object classes that encapsulate UI locators and interactions.
├── services/           # Services for handling API requests or other back-end interactions.
├── tests/              # Contains the actual test files (`.spec.ts`).
└── types/              # TypeScript type definitions for test data.


---

## ⚙️ Local Configuration

To run the tests locally, you need to create a `.env` file in the root of the `browser-tests` directory. This file stores environment-specific URLs and API keys, keeping them separate from the codebase.

### Steps:
1. Create a file named `.env` in the `browser-tests/` directory.
2. Add the required environment variables.

### Example `.env` file:

```env
# URLs
ORCHESTRATOR_STUB_URL="https://ORCH_STUB_URL"

# API Keys
TICF_MANAGEMENT_API_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

## 🚀 Running Tests

Make sure all dependencies are installed by running:

```
npm install
```


from the ipv-core-front root directory. All test commands should be run from within the browser-tests/ directory.

### ▶️ Run a Specific Test in UI Mode (Recommended for Debugging)

This is the best way to develop and debug a single test.

`npx playwright test e2e-tests/coi-fraud-check.spec.ts --ui`

### 🤖 Run All E2E Tests Headless

This command runs all tests located in the e2e-tests/tests/ directory without opening a browser window:

```
npx playwright test tests/
```
