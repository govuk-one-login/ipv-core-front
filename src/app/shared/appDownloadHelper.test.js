const { expect } = require("chai");
const { getAppStoreRedirectUrl } = require("./appDownloadHelper");
const PHONE_TYPES = require("../../constants/phone-types");
const { SERVICE_URL } = require("../../lib/config");

describe("Get app store redirect url", () => {
  it("should get iphone redirect url", () => {
    const result = getAppStoreRedirectUrl(PHONE_TYPES.IPHONE);

    expect(result).to.equal(
      SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE,
    );
  });
  it("should throw if not a phone type", () => {
    expect(function () {
      getAppStoreRedirectUrl("not a phone");
    }).to.throw("Unrecognised phone type: not a phone");
  });
});
