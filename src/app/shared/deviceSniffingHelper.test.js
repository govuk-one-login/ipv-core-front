const { expect } = require("chai");
const PHONE_TYPES = require("../../constants/phone-types");
const {
  sniffPhoneType,
} = require("./deviceSniffingHelper");

describe("User Agent Functions", () => {
  let req;

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
