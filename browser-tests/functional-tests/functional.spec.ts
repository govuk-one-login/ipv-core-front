import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

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

  test("Missing session id", async ({ page }) => {
    // Start a session
    await page.goto("/ipv/page/page-ipv-identity-document-start");

    // Check the page heading for session ended page
    const pageHeading = await page.locator("h1").textContent();
    expect(pageHeading).toBe(
      "Session expired",
    );
  });

  test("Page not found", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testPageNotFound"));

    // Continue to next page
    await page.click("input[type='radio'][value='end']");
    await page.click("button[id='submitButton']");

    // Check the page heading for not found page
    const pageHeading = await page.locator("h1").textContent();
    expect(pageHeading).toBe(
      "Page not found",
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

  test("Device intelligence cookie", async ({ page }) => {
    const cookieName = 'di-device-intelligence';

    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testPageNavigation"));

    // Navigate other page
    await page.click("input[type='radio'][value='end']");
    await page.click("button[id='submitButton']");

    
    // Check for cookie
    const cookies = await page.context().cookies();
    const expectedCookies = cookies.find((cookie: { name: string; }) => cookie.name === cookieName);
    expect(expectedCookies).toBeTruthy();
  });

  test("Client redirect response", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testClient"));

    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(`https://example.com/`);
  });

  test("Successfully gets proven user details from core-back for the page-ipv-reuse screen", async ({ page }) => {
    // Start a session with an existing identity
    await page.goto(getAuthoriseUrlForJourney("reuseJourneyKennethDecerqueira"))

    const reuseIdentityPageHeaderLocator = await page.getByRole('heading', { name: "You have already proved your identity" });
    await expect(reuseIdentityPageHeaderLocator).toBeVisible();

    const nameLocator = await page.getByText('Kenneth Decerqueira');
    await expect(nameLocator).toBeVisible();

    const birthDateLocator = await page.getByText('8 July 1965');
    await expect(birthDateLocator).toBeVisible();

    const addressLocator = await page.getByText('8, Hadley Road')
    await expect(addressLocator).toBeVisible();
  })

  test("Successfully gets proven user details from core-back for the confirm-your-details screen", async ({ page }) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("fraudCheckJourneyKennethDecerqueira"))

    const confirmDetailsPageHeaderLocator = await page.getByRole('heading', { name: "You need to confirm your details" });
    await expect(confirmDetailsPageHeaderLocator).toBeVisible();

    const givenNameLocator = await page.getByText('Kenneth');
    await expect(givenNameLocator).toBeVisible();
    const familyNameLocator = await page.getByText('Decerqueira');
    await expect(familyNameLocator).toBeVisible();

    const birthDateLocator = await page.getByText('8 July 1965');
    await expect(birthDateLocator).toBeVisible();

    const addressLocator = await page.getByText('8, Hadley Road')
    await expect(addressLocator).toBeVisible();
  })

  test("Displays error when no options are selected for update on update-details screen", async ({ page }) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("reuseJourneyKennethDecerqueira"))

    await page.getByRole('heading', { name: "If your details are wrong" }).click();
    await page.getByRole('link', { name: "update your details" }).click();

    // Check we are on the update-details page
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/update-details`);

    await page.click("button[id='submitButton']");

    const errorTextLocator = await page.getByRole('link', { name: "Select which details you need to update" });
    await expect(errorTextLocator).toBeVisible();
  })

  test("Displays error when details are not up-to-date but no options are selected on confirm-your-details screen", async ({ page }) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("fraudCheckJourneyKennethDecerqueira"))

    await page.click('input[value="no"]')

    await page.click("button[id='submitButton']");

    const errorTextLocator = await page.getByRole('link', { name: "Select which details you need to update" });
    await expect(errorTextLocator).toBeVisible();
  })

  test("The selected form options on an update details screen sends the appropriate journey", async ({ page }) => {
    // Start session with existing identity
    await page.goto(getAuthoriseUrlForJourney("reuseJourneyKennethDecerqueira"))

    await page.getByRole('heading', { name: "If your details are wrong" }).click();
    await page.getByRole('link', { name: "update your details" }).click();

    await page.click("input[value='givenNames']");
    await page.click("input[value='address']");
    await page.click("button[id='submitButton']");

    // Check the appropriate endpoint is called and correct page is redirected to according to mock
    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/page-update-name`);
  })
});
