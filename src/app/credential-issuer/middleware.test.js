const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("credential issuer middleware", () => {
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
        params: {},
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
  describe("sendParamsToAPI", function () {
    let req;
    let res;
    let next;
    let axiosResponse;
    let axiosStub = {};

    let configStub = {};
    let middleware;
    let ipvMiddlewareStub = {};

    beforeEach(() => {
      configStub.API_CRI_VALIDATE_CALLBACK = "/journey/cri/validate-callback";
      configStub.API_BASE_URL = "https://example.net/path";
      configStub.CREDENTIAL_ISSUER_ID = "testCredentialIssuerId";
      configStub.EXTERNAL_WEBSITE_HOST = "http://example.com";

      ipvMiddlewareStub.handleJourneyResponse = sinon.fake();

      middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
        "../ipv/middleware": ipvMiddlewareStub,
      });
      req = {
        credentialIssuer: {
          code: "authorize-code-issued",
          state: "oauth-state",
        },
        params: {},
        session: { ipvSessionId: "ipv-session-id" },
        query: { id: "PassportIssuer" },
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
      axiosStub.post = sinon.fake();

      const searchParams = new URLSearchParams([
        ["authorization_code", req.credentialIssuer.code],
        ["credential_issuer_id", req.query.id],
        [
          "redirect_uri",
          `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        ],
        ["state", req.credentialIssuer.state],
      ]);

      await middleware.sendParamsToAPI(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        "https://example.net/path/journey/cri/validate-callback",
        searchParams,
        sinon.match({
          headers: {
            "ipv-session-id": "abadcafe",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      axiosStub.post = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const searchParams = new URLSearchParams([
        ["authorization_code", req.credentialIssuer.code],
        ["credential_issuer_id", req.query.id],
        [
          "redirect_uri",
          `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        ],
        ["state", req.credentialIssuer.state],
        ["error", req.query.error],
        ["error_description", req.query.error_description],
      ]);

      await middleware.sendParamsToAPI(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        "https://example.net/path/journey/cri/validate-callback",
        searchParams,
        sinon.match({
          headers: {
            "ipv-session-id": "abadcafe",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.eql(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(ipvMiddlewareStub.handleJourneyResponse.lastArg).to.equal(
        "journey/next"
      );
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPI(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });
  });

  describe("sendParamsToAPIV2", function () {
    let req;
    let res;
    let next;
    let axiosResponse;
    let axiosStub = {};

    let configStub = {};
    let middleware;
    let ipvMiddlewareStub = {};

    beforeEach(() => {
      configStub.API_CRI_VALIDATE_CALLBACK = "/journey/cri/validate-callback";
      configStub.API_BASE_URL = "https://example.net/path";
      configStub.CREDENTIAL_ISSUER_ID = "testCredentialIssuerId";
      configStub.EXTERNAL_WEBSITE_HOST = "http://example.com";

      ipvMiddlewareStub.handleJourneyResponse = sinon.fake();

      middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
        "../ipv/middleware": ipvMiddlewareStub,
      });
      req = {
        credentialIssuer: {
          code: "authorize-code-issued",
          state: "oauth-state",
        },
        params: { criId: "PassportIssuer" },
        session: { ipvSessionId: "ipv-session-id" },
        query: {},
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
      axiosStub.post = sinon.fake();

      const searchParams = new URLSearchParams([
        ["authorization_code", req.credentialIssuer.code],
        ["credential_issuer_id", req.params.criId],
        [
          "redirect_uri",
          `http://example.com/credential-issuer/callback/${req.params.criId}`,
        ],
        ["state", req.credentialIssuer.state],
      ]);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        "https://example.net/path/journey/cri/validate-callback",
        searchParams,
        sinon.match({
          headers: {
            "ipv-session-id": "abadcafe",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      axiosStub.post = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const searchParams = new URLSearchParams([
        ["authorization_code", req.credentialIssuer.code],
        ["credential_issuer_id", req.query.id],
        [
          "redirect_uri",
          `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        ],
        ["state", req.credentialIssuer.state],
        ["error", req.query.error],
        ["error_description", req.query.error_description],
      ]);

      await middleware.sendParamsToAPI(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        "https://example.net/path/journey/cri/validate-callback",
        searchParams,
        sinon.match({
          headers: {
            "ipv-session-id": "abadcafe",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(res.status).to.be.eql(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(ipvMiddlewareStub.handleJourneyResponse.lastArg).to.equal(
        "journey/next"
      );
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });
  });
});
