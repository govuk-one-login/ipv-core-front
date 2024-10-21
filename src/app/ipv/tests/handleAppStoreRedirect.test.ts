import { expect } from "chai";
import sinon from "sinon";

import PHONE_TYPES from "../../../constants/phone-types";
import config from "../../../lib/config";
import { handleAppStoreRedirect } from "../middleware";

describe("handleAppStoreRedirect", () => {
  const testReq = {
    headers: {},
    body: {},
    params: {},
    session: {
      save: sinon.fake.yields(null),
    },
  } as any;

  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;

  const next = sinon.fake() as any;

  it("redirects to the apple store if the user said they have an iphone", async function () {
    const req = {
      ...testReq,
      params: { ...testReq.params, specifiedPhoneType: PHONE_TYPES.IPHONE },
      method: "GET",
    };
    await handleAppStoreRedirect(req, res, next);

    expect(res.redirect).to.have.been.calledWith(config.APP_STORE_URL_APPLE);
  });

  it("redirects to the android store if the user said they have an android", async function () {
    const req = {
      ...testReq,
      params: { ...testReq.params, specifiedPhoneType: PHONE_TYPES.ANDROID },
      method: "GET",
    };
    await handleAppStoreRedirect(req, res, next);

    expect(res.redirect).to.have.been.calledWith(config.APP_STORE_URL_ANDROID);
  });

  it("throws an error for a bad phone type", async function () {
    const req = {
      ...testReq,
      params: { ...testReq.params, specifiedPhoneType: "not-a-phone-type" },
      method: "GET",
    };
    await handleAppStoreRedirect(req, res, next);

    expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
  });
});
