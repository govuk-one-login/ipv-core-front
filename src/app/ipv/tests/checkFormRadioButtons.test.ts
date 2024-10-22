import { expect } from "chai";
import sinon from "sinon";
import { checkFormRadioButtonSelected } from "../middleware";

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

  beforeEach(() => {
    res.render = sinon.fake();
  });

  it("should render form page again with error if no option is selected", async function () {
    const req = { ...testReq, body: { journey: undefined } };
    await checkFormRadioButtonSelected(req, res, next);

    expect(res.render).to.have.been.calledWith(
      `ipv/page/${req.session.currentPage}.njk`,
      {
        pageId: req.session.currentPage,
        csrfToken: undefined,
        context: undefined,
        pageErrorState: true,
      },
    );
    expect(next).to.have.not.been.calledOnce;
  });

  it("should pass to next if an option is selected", async function () {
    const req = { ...testReq, body: { journey: "someJourney" } };
    await checkFormRadioButtonSelected(req, res, next);

    expect(res.render).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });
});
