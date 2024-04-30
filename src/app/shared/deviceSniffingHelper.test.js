const { expect } = require("chai");
const PHONE_TYPES = require("../../constants/phone-types");
const {
  getJourneyOnSniffing,
  sniffPhoneType,
} = require("./deviceSniffingHelper");

describe("User Agent Functions", () => {
  let req;

  describe("getJourneyOnSniffing", () => {
    beforeEach(() => {
      req = {
        body: {
          journey: "appTriage",
        },
      };
    });

    it("should append 'Smartphone' to journey for mobile devices", () => {
      req.headers = {
        // Windows Phone
        "user-agent":
          "Mozilla/5.0 (Windows Phone 10.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0) like Gecko",
      };
      const journeyEvent = getJourneyOnSniffing(req);
      expect(journeyEvent).to.equal("appTriageSmartphone");
    });

    it("should append 'Iphone' for iOS devices", () => {
      req.headers = {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1",
      };
      const journeyEvent = getJourneyOnSniffing(req);
      expect(journeyEvent).to.equal("appTriageSmartphoneIphone");
    });

    it("should append 'Android' for Android devices", () => {
      req.headers = {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR6.170623.013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36",
      };
      const journeyEvent = getJourneyOnSniffing(req);
      expect(journeyEvent).to.equal("appTriageSmartphoneAndroid");
    });
  });

  describe("sniffPhoneType", () => {
    beforeEach(() => {
      req = {};
    });

    it("should return IPHONE for iOS user agents", () => {
      req.headers = {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1",
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal(PHONE_TYPES.IPHONE);
    });

    it("should return ANDROID for Android user agents", () => {
      req.headers = {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR6.170623.013) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36",
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal(PHONE_TYPES.ANDROID);
    });

    it("should return specifiedPhoneType when OS is not iOS or Android", () => {
      req.headers = {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      };
      const result = sniffPhoneType(req, "fallback");
      expect(result).to.equal("fallback");
    });
  });
});
