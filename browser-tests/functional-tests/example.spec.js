const { test, expect } = require("@playwright/test");

test("Example page navigation", async ({ page }) => {
  // Start a session
  await page.goto(getAuthoriseUrlForJourney("examplePageNavigation"));

  // Go to the F2F start page
  await page.click("input[type='radio'][value='end']");
  await page.click("button[id='submitButton']");
  await page.waitForURL("**/page-ipv-identity-postoffice-start");

  // Check the page heading
  const pageHeading = await page.locator("h1").textContent();
  expect(pageHeading).toBe(
    "Prove your identity at a Post Office with one of the following types of photo ID",
  );
});

test("Example welsh language", async ({ page }) => {
  // Start a session
  await page.goto(getAuthoriseUrlForJourney("exampleWelshLanguage"));

  // Click the language toggle
  await page.click('[rel="alternate"]');

  // Check the page heading
  const pageHeading = await page.locator("h1").textContent();
  expect(pageHeading).toBe(
    "Dywedwch wrthym os oes gennych un o’r mathau canlynol o ID gyda llun",
  );
});

function getAuthoriseUrlForJourney(journey) {
  return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
}
