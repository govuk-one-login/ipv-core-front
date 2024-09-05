const { test, expect } = require("@playwright/test");

test("Example test", async ({ page }) => {
  await page.goto("/healthcheck");

  const titleEscape = await page.title();
  expect(titleEscape).toBe(
    "",
  );
});

test("Example test 2", async ({ page }) => {
  await page.goto(getAuthoriseUrlForJourney("exampleTest"));
  await page.click("input[type='radio'][value='end']");
  await page.click("button[id='submitButton']");
  await page.waitForURL("**/page-ipv-identity-postoffice-start");

  const title = await page.title();
  expect(title).toBe(
    "Prove your identity at a Post Office with one of the following types of photo ID – GOV.UK One Login",
  );

  //await page.click("a[hreflang='cy']");
});

function getAuthoriseUrlForJourney(journey) {
  return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
}
