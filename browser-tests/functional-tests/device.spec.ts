import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

const HTTP_HEADER_USER_AGENT_ANDROID =
  "Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR6.170623.013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36";
const HTTP_HEADER_USER_AGENT_IPHONE_VALID_VERSION =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/14.0 Mobile/14E277 Safari/602.1";
const HTTP_HEADER_USER_AGENT_IPHONE_INVALID_VERSION =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1";

const domainUrl = process.env.WEBSITE_HOST;

test.describe("iPhone tests - valid version", () => {
  test.use({ userAgent: HTTP_HEADER_USER_AGENT_IPHONE_VALID_VERSION });

  test("Handling identify-device", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testIdentifyDeviceIphone"));

    // Have core-back return an identify-device page response
    // Core front should convert that page to a mobileDownloadIphone event which core back will then respond to with
    // a pyi-triage-mobile-download-app page response
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/pyi-triage-mobile-download-app`);
  });

  test("Selecting the download link redirects the browser to the apple app store", async ({
    page,
  }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("strategicAppTriageIphone"));

    // On the document start page, after selecting continue, we skip the iphone
    // confirmation page and go straight to the mobile download page for testing purposes.
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // On mobile download app page with "iphone" context
    // Start waiting for redirect response before clicking button
    const responsePromise = page.waitForResponse(
      (response) => response.status() == 301,
    );
    await page
      .getByRole("button", { name: "Download GOV.UK One Login" })
      .click();
    const response = await responsePromise;

    expect(response.headers()["location"]).toMatch(
      /^.*apps\.apple\.com\/gb\/app\/gov-uk-id-check.*$/,
    );
  });

  test("Should redirect to apple store despite the user selecting android", async ({
    page,
  }) => {
    // Start a session
    await page.goto(
      getAuthoriseUrlForJourney("userSelectsDifferentDeviceIphone"),
    );

    // On the document start page, after selecting continue, we go straight to
    // pyi-triage-mobile-download-app with android context to simulate a user choosing
    // the android option despite having an iphone
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // On mobile download app page with "iphone" context
    // Start waiting for redirect response before clicking button
    const responsePromise = page.waitForResponse(
      (response) => response.status() == 301,
    );
    await page
      .getByRole("button", { name: "Download GOV.UK One Login" })
      .click();
    const response = await responsePromise;

    expect(response.headers()["location"]).toMatch(
      /^.*apps\.apple\.com\/gb\/app\/gov-uk-id-check.*$/,
    );
  });
});

test.describe("Iphone tests - invalid version", () => {
  test.use({ userAgent: HTTP_HEADER_USER_AGENT_IPHONE_INVALID_VERSION });

  test("Handling identify-device", async ({ page }) => {
    // Start a session
    await page.goto(
      getAuthoriseUrlForJourney("testIdentifyDeviceIphoneInvalidVersion"),
    );

    // Have core-back return an identify-device page response
    // Core front should convert that page to an appTriageSmartphone event which core back will then respond to with
    // a prove-identity-another-type-photo-id page response
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(
      `${domainUrl}/ipv/page/prove-identity-another-type-photo-id`,
    );
  });
});

test.describe("Android tests", () => {
  test.use({ userAgent: HTTP_HEADER_USER_AGENT_ANDROID });

  test("Handling identify-device", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testIdentifyDeviceAndroid"));

    // Have core-back return an identify-device page response
    // Core front should convert that page to an mobileDownloadAndroid event which core back will then respond to with
    // a confirm-your-details page response
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const url = page.url();
    expect(url).toBe(`${domainUrl}/ipv/page/confirm-your-details`);
  });

  test("Selecting the download link redirects the browser to the google play store", async ({
    page,
  }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("strategicAppTriageAndroid"));

    // On the document start page, after selecting continue, we skip the android
    // confirmation page and go straight to the mobile download page for testing purposes.
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // On mobile download app page with "iphone" context
    await page
      .getByRole("button", { name: "Download GOV.UK One Login" })
      .click();

    expect(page.url()).toMatch(
      /^.*play\.google\.com\/store\/apps\/details\?id=uk\.gov\.documentchecking$/,
    );
  });

  test("Should redirect to google play store despite the user selecting iphone", async ({
    page,
  }) => {
    // Start a session
    await page.goto(
      getAuthoriseUrlForJourney("userSelectsDifferentDeviceAndroid"),
    );

    // On the document start page, after selecting continue, we go straight to
    // pyi-triage-mobile-download-app with iphone context to simulate a user choosing
    // the iphone option despite having an android
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // On mobile download app page with "iphone" context
    await page
      .getByRole("button", { name: "Download GOV.UK One Login" })
      .click();

    expect(page.url()).toMatch(
      /^.*play\.google\.com\/store\/apps\/details\?id=uk\.gov\.documentchecking$/,
    );
  });
});
