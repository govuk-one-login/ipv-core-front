const { test, expect } = require("@playwright/test");
const { getAuthoriseUrlForJourney } = require("./helpers")

const HTTP_HEADER_USER_AGENT_ANDROID =
  "Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR6.170623.013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36";
const HTTP_HEADER_USER_AGENT_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1";

const domainUrl = process.env.WEBSITE_HOST;

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
