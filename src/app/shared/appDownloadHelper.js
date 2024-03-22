const {
  SERVICE_URL,
  SERVICE_DOMAIN,
  ANDROID_APP_ID,
} = require("../../lib/config");
const PHONE_TYPES = require("../../constants/phone-types");

// Returns the url of the app redirect route for the requested phone type. For Android phones the url is wrapped in an
// intent so the app is launched if it is already installed on the device.
function getAppStoreRedirectUrl(phoneType) {
  const browserUrl = SERVICE_URL + "/ipv/app-redirect/" + phoneType;

  if (phoneType === PHONE_TYPES.IPHONE) {
    return browserUrl;
  } else if (phoneType === PHONE_TYPES.ANDROID) {
    return `intent://${SERVICE_DOMAIN}/ipv/app-redirect/#Intent;scheme=https;package=${ANDROID_APP_ID};S.browser_fallback_url=${encodeURIComponent(browserUrl)};end`;
  }

  throw new Error(`Unrecognised phone type: ${phoneType}`);
}

module.exports = {
  getAppStoreRedirectUrl,
};
