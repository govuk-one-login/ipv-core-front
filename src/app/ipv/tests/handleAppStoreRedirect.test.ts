import sinon from "sinon";
import { PHONE_TYPE } from "../../../constants/device-constants";
import config from "../../../config/config";
import { handleAppStoreRedirect } from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import BadRequestError from "../../../errors/bad-request-error";

describe("handleAppStoreRedirect", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    session: {
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  it("redirects to the apple store if the user said they have an iphone", async function () {
    // Arrange
    const req = createRequest({
      params: { specifiedPhoneType: PHONE_TYPE.IPHONE },
    });
    const res = createResponse();

    // Act
    await handleAppStoreRedirect(req, res, next);

    // Assert
    expect(res.redirect).to.have.been.calledOnceWith(config.APP_STORE_URL_APPLE);
  });

  it("redirects to the android store if the user said they have an android", async function () {
    // Arrange
    const req = createRequest({
      params: { specifiedPhoneType: PHONE_TYPE.ANDROID },
    });
    const res = createResponse();

    // Act
    await handleAppStoreRedirect(req, res, next);

    // Assert
    expect(res.redirect).to.have.been.calledOnceWith(config.APP_STORE_URL_ANDROID);
  });

  it("throws an error for a bad phone type", async function () {
    // Arrange
    const req = createRequest({
      params: { specifiedPhoneType: "not-a-phone-type" },
    });
    const res = createResponse();

    // Act & Assert
    await expect(
      (async () => await handleAppStoreRedirect(req, res, next))(),
    ).to.be.rejectedWith(
      BadRequestError,
      "Unrecognised phone type: not-a-phone-type",
    );
  });
});
