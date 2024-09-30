const UAParser = require("ua-parser-js");
const PHONE_TYPES = require("../../constants/phone-types");
const OS_TYPES = require("../../constants/os-types");

function sniffPhoneType(req, fallback = "") {
  const parser = new UAParser(req.headers["user-agent"]);

  switch (parser.getOS()["name"]) {
    case OS_TYPES.IOS:
      return PHONE_TYPES.IPHONE;
    case OS_TYPES.ANDROID:
      return PHONE_TYPES.ANDROID;
    default:
      return fallback;
  }
}

module.exports = {
  sniffPhoneType,
};
