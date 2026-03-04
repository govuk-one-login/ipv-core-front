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

- Check `steps/common.steps.ts` before writing new steps — for example, it contains reusable steps for starting journeys, submitting CRI stub details and generic page interactions and assertions.
- Only create a new step file when the step is **specific to a particular journey** (e.g. `repeat-fraud-check.steps.ts` for RFC-specific interactions, `f2f.steps.ts` for F2F credential assertions).
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
