import { expect } from "chai";
import sinon from "sinon";
import {
  renderAttemptRecoveryPage,
  renderFeatureSetPage,
  setRequestPageId,
  staticPageMiddleware,
} from "../middleware";

describe("journey middleware", () => {
  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;

  const testReq = {
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      featureSet: "feature-set",
      save: sinon.fake.yields(null),
    },
    params: { pageId: "page-ipv-identity-document-start" },
    csrfToken: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
  } as any;

  const next = sinon.fake() as any;

  context("setRequestPageId", () => {
    it("should return a handler that sets the page ID on a request", async function () {
      const newPageId = "new-page-id";
      const handler = setRequestPageId(newPageId);

      const req = { ...testReq };
      await handler(req, res, next);

      expect(req.params.pageId).to.equal(newPageId);
      expect(next).to.have.been.called;
    });
  });

  context("renderAttemptRecoveryPage", () => {
    it("should render attempt recovery page", () => {
      renderAttemptRecoveryPage(testReq, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-attempt-recovery.njk",
      );
    });
  });

  context("staticPageMiddleware", () => {
    it("should render static document type page", () => {
      const req = {} as any;
      const res = {
        render: sinon.spy(),
      } as any;

      const handler = staticPageMiddleware("page-ipv-identity-document-types");

      handler(req, res);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/page-ipv-identity-document-types.njk",
      );
    });
  });

  context("renderFeatureSetPage", () => {
    it("should render featureSet page", () => {
      renderFeatureSetPage(testReq, res);
      expect(res.render).to.have.been.calledWith("ipv/page-featureset.njk");
    });
  });
});
