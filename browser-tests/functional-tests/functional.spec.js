const { test, expect } = require("@playwright/test");

const HTTP_HEADER_USER_AGENT_ANDROID =
  "Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR6.170623.013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36";
const HTTP_HEADER_USER_AGENT_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1";

const domainUrl = process.env.WEBSITE_HOST;

test.describe.parallel("Functional tests", () => {
  test("Handover from orchestration", async ({ page }) => {
    // Start a session for new identity
    await page.goto(getAuthoriseUrlForJourney("testPageNavigation"));

    // Check that we are on the start page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-ipv-identity-document-start`);
  });

  test("Page navigation", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testPageNavigation"));

    // Go to the F2F start page
    await page.click("input[type='radio'][value='end']");
    await page.click("button[id='submitButton']");

    // Check that we are on the post office start page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-ipv-identity-postoffice-start`);
  });

  test("Welsh language toggle", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testWelshLanguage"));

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
    await page.goto(getAuthoriseUrlForJourney("testContext"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // Check that we use the context returned by imposter to render the page
    const contextSpecificTextLocator = await page.getByText("Use your UK photocard driving licence");
    await expect(contextSpecificTextLocator).toBeVisible();
  });

  test("Visiting a CRI", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testCri"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // When we come back from DCMAW with access_denied, core back eventually sends us to page-multiple-doc-check
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-multiple-doc-check`);
  });

  test("Successfully gets proven user details from core-back for the page-ipv-reuse screen", async ({ page }) => {
    // Start a session with an existing identity
    await page.goto(getAuthoriseUrlForJourney("reuseJourneyKennethDecerqueira"))

    const reuseIdentityPageHeaderLocator = await page.getByRole('heading', {name: "You have already proved your identity"});
    await expect(reuseIdentityPageHeaderLocator).toBeVisible();

    const nameLocator = await page.getByText('Kenneth Decerqueira');
    await expect(nameLocator).toBeVisible();

    const birthDateLocator = await page.getByText('8 July 1965');
    await expect(birthDateLocator).toBeVisible();

    const addressLocator = await page.getByText('8 Hadley Road')
    await expect(addressLocator).toBeVisible();
  })

  test("Successfully gets proven user details from core-back for the confirm-your-details screen", async ({ page }) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("fraudCheckJourneyKennethDecerqueira"))

    const confirmDetailsPageHeaderLocator = await page.getByRole('heading', {name: "You need to confirm your details"});
    await expect(confirmDetailsPageHeaderLocator).toBeVisible();

    const givenNameLocator = await page.getByText('Kenneth');
    await expect(givenNameLocator).toBeVisible();
    const familyNameLocator = await page.getByText('Decerqueira');
    await expect(familyNameLocator).toBeVisible();

    const birthDateLocator = await page.getByText('8 July 1965');
    await expect(birthDateLocator).toBeVisible();

    const addressLocator = await page.getByText('8 Hadley Road')
    await expect(addressLocator).toBeVisible();
  })

  test("Displays error when no options are selected for update on update-details screen", async ({page}) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("reuseJourneyKennethDecerqueira"))

    await page.getByRole('heading', {name: "If your details are wrong"}).click();
    await page.getByRole('link', {name: "update your details"}).click();

    // Check we are on the update-details page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/update-details`);

    await page.click("button[id='submitButton']");

    const errorTextLocator = await page.getByRole('link', { name: "Select which details you need to update, or select 'I do not need to update my details'" });
    await expect(errorTextLocator).toBeVisible();
  })

  test("Displays error when details are not up-to-date but no options are selected on confirm-your-details screen", async ({page}) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("fraudCheckJourneyKennethDecerqueira"))

    await page.click('input[value="no"]')

    await page.click("button[id='submitButton']");

    const errorTextLocator = await page.getByRole('link', { name: "Select which details you need to update" });
    await expect(errorTextLocator).toBeVisible();
  })
});

test.describe("iPhone tests", () => {
  test.use({ userAgent: HTTP_HEADER_USER_AGENT_IPHONE });

  test("Handling identify-device", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testIdentifyDeviceIphone"));

    // Have core-back return an identify-device page response
    // Core front should convert that page to an appTriageIphone event which core back will then respond to with
    // a prove-identity-another-type-photo-id page response
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/prove-identity-another-type-photo-id`);
  });
});

test.describe("Android tests", () => {
  test.use({ userAgent: HTTP_HEADER_USER_AGENT_ANDROID });

  test("Handling identify-device", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testIdentifyDeviceAndroid"));

    // Have core-back return an identify-device page response
    // Core front should convert that page to an appTriageIphone event which core back will then respond to with
    // a prove-identity-another-type-photo-id page response
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/prove-identity-another-type-photo-id`);
  });
});

test.describe("Error tests", () => {
  test("Handles an unexpected error from core-back", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testError"));

    // Go to the error
    await page.goto("/ipv/journey/page-ipv-identity-document-start/error")

    // When we come back with an error
    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles an unexpected error after a CRI callback", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testCriError"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // When we come back from DCMAW with an error
    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });
});

// Put the journey into the 'state' parameter of the request so that imposter sends it back as the IpvSessionId
// See the readme and/or `imposter/config/api-config.yaml` for more information
function getAuthoriseUrlForJourney(journey) {
  return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
}
