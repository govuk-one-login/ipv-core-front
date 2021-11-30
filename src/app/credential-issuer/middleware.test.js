const proxyquire = require("proxyquire");

describe("credential issuer middleware", () => {
  describe("redirectToAuthorize", () => {
    let req;
    let res;
    let configStub;

    beforeEach(() => {
      req = {};
      res = { redirect: sinon.fake(), send: sinon.fake() };
      configStub = {};
    });
    it("should successfully be redirected", async function () {
      configStub.CREDENTIAL_ISSUER_BASE_URL = "http://example.com";

      const { redirectToAuthorize } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await redirectToAuthorize(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `http://example.com/authorize`
      );
    });

    context("with an empty base url", () => {
      beforeEach(() => {
        configStub.CREDENTIAL_ISSUER_BASE_URL = "";
      });

      it("should send 500 error", async () => {
        const { redirectToAuthorize } = proxyquire("./middleware", {
          "../../lib/config": configStub,
        });

        await redirectToAuthorize(req, res);

        expect(res.send).to.have.been.calledWith(500);
      });
      it("should not call redirect", async () => {
        const { redirectToAuthorize } = proxyquire("./middleware", {
          "../../lib/config": configStub,
        });

        await redirectToAuthorize(req, res);

        expect(res.redirect).not.to.have.been.called;
      });
    });
  });

  describe("addCallbackParamsToRequest", () => {
    let req;
    let res;
    let next;
    let configStub;

    beforeEach(() => {
      req = {
        query: {
          code: "xyz",
        },
        session: {},
      };
      configStub = {};
      next = sinon.fake();
    });

    it("should save code to request", async function () {
      const { addCallbackParamsToRequest } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });
      await addCallbackParamsToRequest(req, res, next);

      expect(req.credentialIssuer.code).to.equal(req.query.code);
    });

    it("should call next", async function () {
      const { addCallbackParamsToRequest } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await addCallbackParamsToRequest(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("renderDebugPage", () => {
    let req;
    let res;
    let configStub;

    beforeEach(() => {
      res = {
        redirect: sinon.fake(),
      };
      configStub = {};
    });

    it("should redirectToDebugPage", () => {
      const { redirectToDebugPage } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      redirectToDebugPage(req, res);

      expect(res.redirect).to.have.been.calledWith("/debug/");
    });
  });
});
