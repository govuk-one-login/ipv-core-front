const { expect } = require("chai");
const PHONE_TYPES = require("../../constants/phone-types");
const {
  detectAppTriageEvent,
  sniffPhoneType,
} = require("./deviceSniffingHelper");
const EVENTS = require("../../constants/events");
const TEST_CONSTANTS = require("../../../test/constants");

describe("User Agent Functions", () => {
  let req;

  describe("detectAppTriageEvent", () => {
    beforeEach(() => {
      req = {
        body: {
          journey: "appTriage",
        },
      };
    });

    it("should return APP_TRIAGE for unrecognised devices", () => {
      req.headers = {
        "user-agent":
          TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_NO_PHONE,
      };
      const journeyEvent = detectAppTriageEvent(req);
      expect(journeyEvent).to.equal(EVENTS.APP_TRIAGE);
    });

    it("should return APP_TRIAGE_IPHONE for iOS devices", () => {
      req.headers = {
        "user-agent":
          TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_IPHONE,
      };
      const journeyEvent = detectAppTriageEvent(req);
      expect(journeyEvent).to.equal(EVENTS.APP_TRIAGE_IPHONE);
    });

    it("should return APP_TRIAGE_ANDROID for Android devices", () => {
      req.headers = {
        "user-agent":
          TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_ANDROID,
      };
      const journeyEvent = detectAppTriageEvent(req);
      expect(journeyEvent).to.equal(EVENTS.APP_TRIAGE_ANDROID);
    });
  });


  describe("sniffPhoneType", () => {
    beforeEach(() => {
      req = {};
    });

    it("should return IPHONE for iOS user agents", () => {
      req.headers = {
        "user-agent":
        TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_IPHONE,
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal(PHONE_TYPES.IPHONE);
    });

    it("should return ANDROID for Android user agents", () => {
      req.headers = {
        "user-agent":
        TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_ANDROID,
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal(PHONE_TYPES.ANDROID);
    });

    it("should return fallback when OS is not iOS or Android", () => {
      req.headers = {
        "user-agent":
        TEST_CONSTANTS.HTTP_HEADER_USER_AGENT_NO_PHONE,
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal("fallback");
    });
  });
});
