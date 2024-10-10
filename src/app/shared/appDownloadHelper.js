const { SERVICE_URL } = require("../../lib/config").default;
const PHONE_TYPES = require("../../constants/phone-types");

function getAppStoreRedirectUrl(phoneType) {
  if (phoneType !== PHONE_TYPES.IPHONE && phoneType !== PHONE_TYPES.ANDROID) {
    throw new Error(`Unrecognised phone type: ${phoneType}`);
  }

  return SERVICE_URL + "/ipv/app-redirect/" + phoneType;
}

module.exports = {
  getAppStoreRedirectUrl,
};
