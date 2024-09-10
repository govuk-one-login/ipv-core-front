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

// This test goes through a realistic journey. Arguably it's overkill to just check that
// Core front handles page contexts correctly.
test("Example context and CRI", async ({ page }) => {
  // Start a session
  await page.goto(getAuthoriseUrlForJourney("exampleContext"));

  // Go to the DCMAW CRI
  await page.click("input[type='radio'][value='appTriage']");
  await page.click("button[id='submitButton']");

  // When we come back from DCMAW with access_denied, core back eventually sends us to page-multiple-doc-check
  const url = page.url();
  expect(url).toBe("http://localhost:4601/ipv/page/page-multiple-doc-check");

  // Go to the web passport CRI
  await page.click("input[type='radio'][value='ukPassport']");
  await page.click("button[id='submitButton']");

  // When we come back from web passport with access_denied, core back eventually sends us to prove-identity-another-type-photo-id with context 'passport'
  const url2 = page.url();
  expect(url2).toBe("http://localhost:4601/ipv/page/prove-identity-another-type-photo-id");

  const contextSpecificTextLocator = await page.getByText("Use your UK photocard driving licence");
  const textCount = await contextSpecificTextLocator.count();
  expect(textCount).toBe(1);
});

// Put the journey into the 'state' parameter of the request so that imposter sends it back as the IpvSessionId
function getAuthoriseUrlForJourney(journey) {
  return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
}
