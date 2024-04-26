const UAParser = require("ua-parser-js");
const PHONE_TYPES = require("../../constants/phone-types");
const OS_TYPES = require("../../constants/os-types");

function modifyJourneyOnSniffing(req) {
  const parser = new UAParser(req.headers["user-agent"]);

  if (parser.getDevice()["type"] === "mobile") {
    req.body.journey += "Smartphone";
    switch (parser.getOS()["name"]) {
      case OS_TYPES.IOS:
        req.body.journey += "Iphone";
        break;
      case OS_TYPES.ANDROID:
        req.body.journey += "Android";
        break;
    }
  }
}

function preferenceSniffedPhoneType(req) {
  const parser = new UAParser(req.headers["user-agent"]);

  switch (parser.getOS()["name"]) {
    case OS_TYPES.IOS:
      return PHONE_TYPES.IPHONE;
    case OS_TYPES.ANDROID:
      return PHONE_TYPES.ANDROID;
    default:
      return req.params.specifiedPhoneType;
  }
}

module.exports = {
  modifyJourneyOnSniffing,
  preferenceSniffedPhoneType,
};
