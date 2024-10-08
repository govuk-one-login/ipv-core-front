const { expect } = require("chai");
const proxyquire = require("proxyquire");
const sinon = require("sinon");

describe("credential issuer middleware", () => {
  describe("sendParamsToAPI", function () {
    let req;
    let res;
    let next;
    let axiosResponse;
    let CoreBackServiceStub = {};
    let configStub = {};
    let middleware;
    let ipvMiddlewareStub = {};

    beforeEach(() => {
      configStub.API_CRI_CALLBACK = "/cri/callback";
      configStub.API_BASE_URL = "https://example.net/path";
      configStub.CREDENTIAL_ISSUER_ID = "testCredentialIssuerId";
      configStub.EXTERNAL_WEBSITE_HOST = "http://example.com";

      ipvMiddlewareStub.handleBackendResponse = sinon.fake();

      middleware = proxyquire("./middleware", {
        "../../services/coreBackService": CoreBackServiceStub,
        "../../lib/config": { default: configStub },
        "../ipv/middleware": ipvMiddlewareStub,
      });
      req = {
        id: "1",
        params: {},
        csrfToken: sinon.fake(),
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          featureSet: "feature-set",
        },
        query: {
          id: "PassportIssuer",
          code: "authorize-code-issued",
          state: "oauth-state",
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
      };
      next = sinon.fake();
      axiosResponse = {
        status: {},
      };
    });

    it("should call axios with correct parameters", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      CoreBackServiceStub.postCriCallback = sinon.fake();

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPI(req, res, next);

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      CoreBackServiceStub.postCriCallback = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
        error: req.query.error,
        errorDescription: req.query.error_description,
      };

      await middleware.sendParamsToAPI(req, res, next);

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      CoreBackServiceStub.postCriCallback = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.calledWith(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      CoreBackServiceStub.postCriCallback = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(ipvMiddlewareStub.handleBackendResponse.lastArg.journey).to.equal(
        "journey/next",
      );
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      CoreBackServiceStub.postCriCallback = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPI(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should call cri callback when ipvSessionId is missing", async () => {
      CoreBackServiceStub.postCriCallback = sinon.fake();
      req.session.ipvSessionId = null;

      await middleware.sendParamsToAPI(req, res, next);

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
      };

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });
  });

  describe("sendParamsToAPIV2", function () {
    let req;
    let res;
    let next;
    let axiosResponse;
    let CoreBackServiceStub = {};
    let configStub = {};
    let middleware;
    let ipvMiddlewareStub = {};

    beforeEach(() => {
      configStub.API_CRI_CALLBACK = "/cri/callback";
      configStub.API_BASE_URL = "https://example.net/path";
      configStub.CREDENTIAL_ISSUER_ID = "testCredentialIssuerId";
      configStub.EXTERNAL_WEBSITE_HOST = "http://example.com";

      ipvMiddlewareStub.handleBackendResponse = sinon.fake();

      middleware = proxyquire("./middleware", {
        "../../services/coreBackService": CoreBackServiceStub,
        "../../lib/config": { default: configStub },
        "../ipv/middleware": ipvMiddlewareStub,
      });
      req = {
        id: "1",
        params: { criId: "PassportIssuer" },
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          featureSet: "feature-set",
        },
        query: {
          code: "authorize-code-issued",
          state: "oauth-state",
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
      };
      next = sinon.fake();
      axiosResponse = {
        status: {},
      };
    });

    it("should call axios with correct parameters", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      CoreBackServiceStub.postCriCallback = sinon.fake();

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      CoreBackServiceStub.postCriCallback = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
        error: req.query.error,
        errorDescription: req.query.error_description,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      CoreBackServiceStub.postCriCallback = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(res.status).to.be.calledWith(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      CoreBackServiceStub.postCriCallback = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(ipvMiddlewareStub.handleBackendResponse.lastArg.journey).to.equal(
        "journey/next",
      );
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      CoreBackServiceStub.postCriCallback = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should call cri callback when ipvSessionId is missing", async () => {
      CoreBackServiceStub.postCriCallback = sinon.fake();
      req.session.ipvSessionId = null;

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(CoreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });
  });
});
