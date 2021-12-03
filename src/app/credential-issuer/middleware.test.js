const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("credential issuer middleware", () => {
  describe("redirectToAuthorize", () => {
    let req;
    let res;
    let configStub;

    beforeEach(() => {
      req = {
        redirectURL: "http://the.credentialissuer.authorize.url",
      };
      res = {
        redirect: sinon.fake(),
        send: sinon.fake(),
      };
      configStub = {};
    });
    it("should successfully be redirected", async function () {
      const { redirectToAuthorize } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await redirectToAuthorize(req, res);

      expect(res.redirect).to.have.been.calledWith(req.redirectURL);
    });
  });

  describe("buildCredentialIssuerRedirectURL", () => {
    let req;
    let res;
    let next;
    let configStub;

    beforeEach(() => {
      req = {};
      res = { send: sinon.fake() };
      next = sinon.fake();
      configStub = {};
    });

    it("should successfully return expected redirect url", async function () {
      configStub.CREDENTIAL_ISSUER_BASE_URL = "http://example.com";
      configStub.PORT = 2200;
      const { buildCredentialIssuerRedirectURL } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await buildCredentialIssuerRedirectURL(req, res, next);

      expect(req.redirectURL).to.equal(
        "http://example.com/authorize?response_type=code&client_id=test&state=test-state&redirect_uri=http%3A%2F%2Flocalhost%3A2200%2Fcredential-issuer%2Fcallback"
      );
    });

    context("with an empty base url", () => {
      beforeEach(() => {
        configStub.CREDENTIAL_ISSUER_BASE_URL = "";
      });

      it("should send 500 error", async () => {
        const { buildCredentialIssuerRedirectURL } = proxyquire(
          "./middleware",
          {
            "../../lib/config": configStub,
          }
        );

        await buildCredentialIssuerRedirectURL(req, res);

        expect(res.send).to.have.been.calledWith(500);
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

  describe("sendParamsToAPI", function () {
    let req;
    let res;
    let next;
    let axiosResponse;
    let axiosStub = {};

    let configStub = {};


    beforeEach(() => {
      req = {
        credentialIssuer: { code: "authorize-code-issued" },
      };
      res = {
        status: sinon.fake(),
      };
      next = sinon.fake();
      axiosResponse = {
        status: {},
      };
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosStub.post = sinon.fake.returns(axiosResponse);
      const middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
      });

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.eql(200);
    });

    it("should send code to core backend and return with a 404 response", async () => {
      axiosStub.post = sinon.fake.returns(axiosResponse);
      const middleware = proxyquire("./middleware", { axiosStub });

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.eql(404);
    });

    it("should send code to core backend and return with an error", async () => {
      axiosStub.post = sinon.fake.throws(axiosResponse);
      const middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
      });

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.error).to.be.eql('Error');
    });
  });
});
