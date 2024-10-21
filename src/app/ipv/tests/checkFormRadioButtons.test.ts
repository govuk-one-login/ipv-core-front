import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("checkFormRadioButtonSelected middleware", () => {
  const testReq = {
    body: {},
    params: { pageId: "page-ipv-identity-document-start" },
    csrfToken: sinon.fake(),
    session: {
      currentPage: "page-ipv-identity-document-start",
      ipvSessionId: "ipv-session-id",
      save: sinon.fake.yields(null),
    },
    log: { error: sinon.fake() },
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

  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": {},
      "../../lib/config": { default: {} },
    },
  );

  beforeEach(() => {
    res.render = sinon.fake();
  });

  it("should render if journey is not defined", async function () {
    const req = { ...testReq, body: { journey: undefined } };
    await middleware.checkFormRadioButtonSelected(req, res, next);

    expect(res.render).to.have.been.called;
    expect(next).to.have.not.been.calledOnce;
  });

  it("should not render if journey is defined", async function () {
    const req = { ...testReq, body: { journey: "someJourney" } };
    await middleware.checkFormRadioButtonSelected(req, res, next);

    expect(res.render).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });
});
