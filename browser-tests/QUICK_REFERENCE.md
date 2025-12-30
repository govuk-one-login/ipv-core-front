# Playwright BDD Quick Reference

## Directory Structure
```
e2e-tests/
├── features/             # 📄 Gherkin feature files (.feature)
├── steps/                # ⚙️  Step definitions (.steps.ts)
├── fixtures/             # 🔧 Test fixtures
├── pages/                # 📋 Page Object Model (POM)
├── services/             # 🌐 API & business logic
├── config/               # ⚙️  Configuration
└── types/                # 📝 TypeScript types
```

## File Naming Convention
```
features/my-feature.feature
steps/my-feature.steps.ts
```

## Running Tests

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --headed` | Run with visible browser |
| `npm test -- --debug` | Debug mode |
| `npm test -- --project=chromium` | Specific browser |
| `npm run update-snapshots` | Update snapshots |

## Gherkin Syntax

### Feature File Structure
```gherkin
Feature: Feature Title
  Description of what this feature does
  
  Background:
    # Runs before each scenario
    Given common setup step
  
  Scenario: Scenario 1
    Given precondition
    When action
    Then verification
  
  Scenario: Scenario 2
    Given different precondition
    When action
    Then verification
```

### Step Keywords
- **Given**: Precondition / setup
- **When**: Action / main interaction
- **Then**: Expected result / verification
- **And/But**: Continue previous keyword

### Step with Parameters
```gherkin
When I enter "<value>" in username field
When I wait for <seconds> seconds
When I click the <button_name> button
```

## Step Definition Template

### Basic Structure
```typescript
import { Given, When, Then } from 'playwright-bdd';
import { expect } from '../fixtures/bdd-fixtures';

Given('step text', async ({ fixture1, fixture2 }) => {
  // Implementation
});

When('step text', async ({ fixture }, testInfo) => {
  // Can use testInfo to store data
  (testInfo as any).key = value;
});

Then('step text', async ({ fixture }, testInfo) => {
  // Can retrieve data from testInfo
  const value = (testInfo as any).key;
});
```

### Available Fixtures
- `page` - Playwright page object
- `request` - API request context
- `orchestratorPage` - Your page objects
- `identityPage`
- `docCheckingPage`
- `drivingLicencePage`
- `addressPage`
- `fraudPage`
- `apiService` - Your service objects
- `expect` - Expect assertion library

### Passing Data Between Steps
```typescript
// Method 1: Using testInfo
Given('I create user', async ({}, testInfo) => {
  const user = { id: '123', name: 'John' };
  (testInfo as any).user = user;
});

Then('user exists', async ({}, testInfo) => {
  const user = (testInfo as any).user;
  expect(user.id).toBe('123');
});

// Method 2: Using BddContext
import { BddContext } from './bdd-context';

Given('I create user', async ({}) => {
  BddContext.set('user', { id: '123', name: 'John' });
});

Then('user exists', async ({}) => {
  const user = BddContext.get('user');
  expect(user.id).toBe('123');
  BddContext.clear();
});
```

## Common Step Patterns

### Navigation
```typescript
Given('I navigate to home page', async ({ page }) => {
  await page.goto('http://localhost:4601');
});

When('I click on {string} link', async ({ page }, linkText: string) => {
  await page.click(`text=${linkText}`);
});
```

### Form Interaction
```typescript
When('I fill {string} with {string}', async ({ page }, field: string, value: string) => {
  await page.fill(`input[name="${field}"]`, value);
});

When('I select {string} from {string}', async ({ page }, option: string, select: string) => {
  await page.selectOption(`select[name="${select}"]`, option);
});
```

### Assertions
```typescript
Then('{string} should be visible', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then('URL should contain {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(path));
});
```

## Scenario Outline (Data-Driven Testing)

```gherkin
Scenario Outline: Login with credentials
  When I enter "<username>" and "<password>"
  Then I should see "<result>"

  Examples:
    | username | password | result          |
    | user1    | pass123  | Welcome user1   |
    | user2    | pass456  | Welcome user2   |
    | invalid  | wrong    | Invalid login   |
```

## Converting from .spec.ts to BDD

### Old Format
```typescript
test('should complete journey', async ({ page1, page2 }) => {
  await test.step('Setup', async () => {
    await page1.setup();
  });
  await test.step('Execute', async () => {
    await page2.action();
  });
});
```

### New Format

**Feature**:
```gherkin
Scenario: Complete journey
  Given I have setup
  When I execute action
  Then process completes
```

**Steps**:
```typescript
Given('I have setup', async ({ page1 }) => {
  await page1.setup();
});

When('I execute action', async ({ page2 }) => {
  await page2.action();
});

Then('process completes', async ({ page2 }) => {
  await page2.verify();
});
```

## Debugging

### Run Single Feature
```bash
npx playwright-bdd e2e-tests/features/my-feature.feature
```

### Debug Mode
```bash
npx playwright-bdd --debug
```

### Headed Mode
```bash
npx playwright-bdd --headed
```

### Trace
```bash
npx playwright-bdd --trace on
```

## Selectors in Steps

```typescript
// Get by role
await page.getByRole('button', { name: 'Submit' });

// Get by text
await page.getByText('Welcome');

// Get by label
await page.getByLabel('Username');

// Get by placeholder
await page.getByPlaceholder('Enter name');

// CSS selector
await page.locator('input[type="submit"]');
```

## Assertions Cheatsheet

```typescript
// Visibility
expect(element).toBeVisible();
expect(element).toBeHidden();

// Text
expect(element).toContainText('text');
expect(element).toHaveText('exact text');

// Value
expect(input).toHaveValue('value');

// Count
expect(elements).toHaveCount(3);

// URL
expect(page).toHaveURL('http://...');

// Title
expect(page).toHaveTitle('Page Title');

// Attributes
expect(element).toHaveAttribute('disabled');
```

## Tips & Best Practices

✅ **Do**
- Write feature files in business language
- Keep steps focused and reusable
- Use fixtures for page objects
- Organize steps by feature
- Use meaningful step text

❌ **Don't**
- Don't include technical details in Gherkin
- Don't hardcode selectors in feature files
- Don't make steps too complex
- Don't create many similar steps (parameterize instead)
- Don't skip assertions

## Helpful Links
- [Playwright BDD](https://github.com/vitalets/playwright-bdd)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
- [Playwright Selectors](https://playwright.dev/docs/locators)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)

---

**Happy Testing! 🎭**
