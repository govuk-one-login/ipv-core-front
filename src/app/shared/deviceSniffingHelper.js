const UAParser = require("ua-parser-js");
const PHONE_TYPES = require("../../constants/phone-types");
const OS_TYPES = require("../../constants/os-types");
const EVENTS = require("../../constants/events");

// The AppTriage event is special in that we want to send a more specialised version if we can detect the current
// device type as being an Android phone or iPhone.
function detectAppTriageEvent(req) {
  const detectedPhone = sniffPhoneType(req);

  switch (detectedPhone) {
    case PHONE_TYPES.ANDROID:
      return EVENTS.APP_TRIAGE_ANDROID;
    case PHONE_TYPES.IPHONE:
      return EVENTS.APP_TRIAGE_IPHONE;
    default:
      return EVENTS.APP_TRIAGE;
  }
}

function sniffPhoneType(req, fallback = null) {
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
  detectAppTriageEvent,
  sniffPhoneType,
};
