const { SERVICE_URL } = require("../../lib/config");
const PHONE_TYPES = require("../../constants/phone-types");
const path = require("path");

// Returns the url of the app redirect route for the requested phone type. For Android phones the url is wrapped in an
// intent so the app is launched if it is already installed on the device.
function getAppStoreRedirectUrl(phoneType) {
  if (phoneType !== PHONE_TYPES.IPHONE && phoneType !== PHONE_TYPES.ANDROID) {
    throw new Error(`Unrecognised phone type: ${phoneType}`);
  }

  return path.join(SERVICE_URL || "/", "ipv", "app-redirect", phoneType);
}

module.exports = {
  getAppStoreRedirectUrl,
};
