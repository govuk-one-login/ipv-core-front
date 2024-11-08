import { expect } from "chai";
import { getAppStoreRedirectUrl } from "./appDownloadHelper";
import { PHONE_TYPES } from "../../constants/device-constants";
import config from "../../lib/config";

describe("Get app store redirect url", () => {
  it("should get iphone redirect url", () => {
    // Act
    const result = getAppStoreRedirectUrl(PHONE_TYPES.IPHONE);

    // Assert
    expect(result).to.equal(
      config.SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE,
    );
  });

  it("should throw if not a phone type", () => {
    // Act & Assert
    expect(() => {
      getAppStoreRedirectUrl("not a phone");
    }).to.throw("Unrecognised phone type: not a phone");
  });
});
