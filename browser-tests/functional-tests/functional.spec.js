const { test, expect } = require("@playwright/test");

const domainUrl = process.env.WEBSITE_HOST;

test.describe.parallel("Functional tests", () => {
  test("Handover from orchestration", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("examplePageNavigation"));

    // Check that we are on the start page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-ipv-identity-document-start`);
  });

  test("Page navigation", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("examplePageNavigation"));

    // Go to the F2F start page
    await page.click("input[type='radio'][value='end']");
    await page.click("button[id='submitButton']");

    // Check that we are on the post office start page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-ipv-identity-postoffice-start`);
  });

  test("Welsh language toggle", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("exampleWelshLanguage"));

    // Click the language toggle
    await page.click('[hreflang="cy"]');

    // Check the page heading for the start page is in Welsh
    const pageHeading = await page.locator("h1").textContent();
    expect(pageHeading).toBe(
      "Dywedwch wrthym os oes gennych un o’r mathau canlynol o ID gyda llun",
    );
  });

  test("Context is used to display page", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("exampleContext"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // Check that we use the context returned by imposter to render the page
    const contextSpecificTextLocator = await page.getByText("Use your UK photocard driving licence");
    await expect(contextSpecificTextLocator).toBeVisible();
  });

  test("Visiting a CRI", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("exampleCri"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // When we come back from DCMAW with access_denied, core back eventually sends us to page-multiple-doc-check
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-multiple-doc-check`);
  });
})

// Put the journey into the 'state' parameter of the request so that imposter sends it back as the IpvSessionId
// See the readme and/or `imposter/config/api-config.yaml` for more information
function getAuthoriseUrlForJourney(journey) {
  return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
}
