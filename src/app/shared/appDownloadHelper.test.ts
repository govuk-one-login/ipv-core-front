import { expect } from "chai";
import { getAppStoreRedirectUrl } from "./appDownloadHelper";
import { PHONE_TYPES } from "../../constants/device-constants";
import config from "../../config/config";

describe("getAppStoreRedirectUrl", () => {
  it("should get iphone redirect url", () => {
    const result = getAppStoreRedirectUrl(PHONE_TYPES.IPHONE);
    expect(result).to.equal(
      `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPES.IPHONE}`,
    );
  });

  it("should get android redirect url", () => {
    const result = getAppStoreRedirectUrl(PHONE_TYPES.ANDROID);
    expect(result).to.equal(
      `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPES.ANDROID}`,
    );
  });

  ["iphone-appOnly", "android-appOnly"].forEach((context) => {
    it(`should normalise and return correct redirect url for ${context}`, () => {
      const result = getAppStoreRedirectUrl(context);
      const expected =
        context.includes("iphone")
          ? `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPES.IPHONE}`
          : `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPES.ANDROID}`;
      expect(result).to.equal(expected);
    });
  });

  it("should throw if not a phone type", () => {
    expect(() => getAppStoreRedirectUrl("not a phone")).to.throw(
      "Unrecognised phone type: not a phone",
    );
  });
});
