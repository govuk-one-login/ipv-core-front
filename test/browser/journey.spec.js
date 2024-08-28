const { test, expect } = require("@playwright/test");

test("Journey using mock server", async ({ page }) => {
  await page.goto("/oauth2/authorize?request=fake&client_id=orchestrator");
  await page.click("input[type='radio'][value='end']");
  await page.click("button[id='submitButton']");
  await page.waitForURL("**/page-ipv-identity-postoffice-start");
  const title = await page.title();
  expect(title).toBe(
    "Prove your identity at a Post Office with one of the following types of photo ID – GOV.UK One Login",
  );
  await page.click("input[type='radio'][value='end']");
  await page.click("button[id='submitButton']");
  await page.waitForURL("**/pyi-escape");
  const titleEscape = await page.title();
  expect(titleEscape).toBe(
    "Find another way to prove your identity – GOV.UK One Login",
  );
});
