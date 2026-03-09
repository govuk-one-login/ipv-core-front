# E2E Test Best Practices

Guidelines for writing and maintaining E2E Playwright BDD tests in this directory.

---

## Writing Feature Files

- Write scenarios from the **user's perspective** and describe what the user does and sees, not internal system behaviour.
- Use the **Given/When/Then** structure consistently:
  - `Given` — preconditions and setup (e.g. starting a journey, completing a prior identity flow)
  - `When` — user actions (e.g. selecting a radio, submitting details)
  - `Then` — assertions (e.g. asserting a page, verifying credentials achieved)
- Use `Background` for shared setup steps across scenarios in the same feature file, rather than duplicating them in every scenario.
- Keep scenarios **independent** and focused.
- Add **tags** for categorisation and selective execution (e.g. `@Build`, `@QualityGateRegressionTest`, `@QualityGateStackTest`). Reference the relevant Jira ticket where applicable (e.g. `@PYIC-7471`).
- Include a descriptive `Feature:` header with a short user story explaining the purpose.

## Reusing Step Definitions

The steps folder has the following structure:

```
steps/                          # Step definitions (.steps.ts) that implement each Gherkin step defined in /features/*.feature
├── ipv-page-steps/             # Each file represents an IPV Core page. These contain the step definitions for all the interactions with that page.
├── orch-stub.steps.ts          # This contains the step definitions for all the interactions with the orch stub (commonly at the beginning and end of a journey).
├── generic.steps.ts            # This contains the step definitions that can be used in isolation across various pages and sub-journeys.
└── <sub-journey>.steps.ts      # These contain step definitions specific to sub-journey.
```

1. Within the `ipv-page-steps/` directory are all the step functions defining interactions and assertions for a given page.
2. `<sub-journey>.steps.ts` files contain step definitions specific to a sub-journey including composite steps.
3. `orch-stub.steps.ts` contains step functions defining interactions with the orch stub.
4. `generic.steps.ts` contains generic assertions and interactions that can be used in isolation across multiple pages
   and sub-journeys.

When adding new Scenarios:

- Check `steps/ipv-page-steps/` when needing a page interaction. All interactions and assertions specific to a given page must be specified within their own `.steps.ts` file to make reusability easier.
  Only create a new file within this folder if the page hasn't yet beed added. The step definitions defining page interactions should use the `performPageAction` function.
- Check `steps/generic.steps.ts` before writing new generic steps/assertions.
- Check the appropriate `<sub-journey>.steps.ts` file if there is an existing step that can be used e.g. composite functions. Only create a new sub-journey step file when the step is
  **specific to a particular journey** (e.g. `repeat-fraud-check.steps.ts` for RFC-specific interactions, `f2f.steps.ts` for F2F credential assertions) and that sub-journey doesn't yet have its own file.
- Use **parameterised steps** with `{string}` and `{int}` placeholders to keep steps generic and reusable. You can also use regex-based steps for more complex variations.

## Using Fixtures

- You can access commonised browser interactions through the provided fixtures (`pageUtils`, `criStubUtils`, `orchStubUtils`). These encapsulate common patterns used with Playwright's `Page` object and keeps
  steps concise, but you can still access the built-in `page` fixture if required.
- Use `scenarioContext` to share state (e.g. `userId`, `oauthState`) between steps within a scenario.
- If a utility is commonly used but does not depend on any Playwright objects, consider adding it to the `/helpers` folder instead.

## Managing Test Data

- Add CRI stub persona data to `data/cri-stub-data.ts` using the existing `CriStubDataConfig` structure. Each entry maps a persona name + CRI type to the stub data identifier and evidence scores.
- Custom credentials not already pre-canned by the stubs, can be created in `/data/custom-credentials` using the helpers in `cri-stub-data-builders.ts` and inserted into the `criStubData` object.
- Use descriptive, consistent persona naming (e.g. `alice-parker-changed-first-name`, `kenneth-decerqueira-valid`) so it's clear what the data represents.

## Running and Debugging

After modifying any test file, regenerate the spec files before running:

```bash
npx playwright-bdd --config playwright-bdd.config.ts test
```

For more information on running the E2E tests, see [these docs](readme.md#-running-tests).
