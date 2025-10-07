import { expect } from "chai";
import { getAppStoreRedirectUrl } from "./appDownloadHelper";
import { PHONE_TYPE } from "../../constants/device-constants";
import config from "../../config/config";

describe("getAppStoreRedirectUrl", () => {
  it("should get iphone redirect url", () => {
    const result = getAppStoreRedirectUrl(PHONE_TYPE.IPHONE);
    expect(result).to.equal(
      `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPE.IPHONE}`,
    );
  });

  it("should get android redirect url", () => {
    const result = getAppStoreRedirectUrl(PHONE_TYPE.ANDROID);
    expect(result).to.equal(
      `${config.SERVICE_URL}/ipv/app-redirect/${PHONE_TYPE.ANDROID}`,
    );
  });
});
