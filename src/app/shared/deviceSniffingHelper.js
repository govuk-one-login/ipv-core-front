const UAParser = require("ua-parser-js");
const PHONE_TYPES = require("../../constants/phone-types");
const OS_TYPES = require("../../constants/os-types");

function getJourneyOnSniffing(req) {
  const parser = new UAParser(req.headers["user-agent"]);
  let journeyEvent = req.body.journey;

  if (parser.getDevice()["type"] === "mobile") {
    journeyEvent += "Smartphone";
    switch (parser.getOS()["name"]) {
      case OS_TYPES.IOS:
        journeyEvent += "Iphone";
        break;
      case OS_TYPES.ANDROID:
        journeyEvent += "Android";
        break;
    }
  }

  return journeyEvent;
}

function sniffPhoneType(req, fallback) {
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
  getJourneyOnSniffing,
  sniffPhoneType,
};
