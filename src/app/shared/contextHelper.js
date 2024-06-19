const CONTEXTS = require("../../constants/contexts");
const PHONE_TYPES = require("../../constants/phone-types");

function parseContextAsPhoneType(context) {
  switch (context) {
    case CONTEXTS.IPHONE:
      return PHONE_TYPES.IPHONE;
    case CONTEXTS.ANDROID:
      return PHONE_TYPES.ANDROID;
    default:
      throw new Error(`Context cannot be parsed as a phone type: ${context}`);
  }
}

module.exports = {
  parseContextAsPhoneType,
};
