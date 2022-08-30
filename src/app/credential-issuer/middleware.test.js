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
      configStub.API_CRI_ACCESS_TOKEN_PATH = "/access-token";
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

    context("add-evidence request", () => {
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
          "https://example.net/path/access-token",
          searchParams,
          sinon.match({
            headers: {
              "ipv-session-id": "abadcafe",
              "Content-Type": "application/x-www-form-urlencoded",
            },
          })
        );
      });
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

    it("should send code to core backend and return with a 404 response", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.eql(404);
    });

    it("should send code to core backend and return with an error", async () => {
      axiosStub.post = sinon.fake.throws(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.error).to.be.eql("Error");
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
      configStub.API_CRI_ACCESS_TOKEN_PATH = "/access-token";
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

    context("add-evidence request", () => {
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
          "https://example.net/path/access-token",
          searchParams,
          sinon.match({
            headers: {
              "ipv-session-id": "abadcafe",
              "Content-Type": "application/x-www-form-urlencoded",
            },
          })
        );
      });
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

    it("should send code to core backend and return with a 404 response", async () => {
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(res.status).to.be.eql(404);
    });

    it("should send code to core backend and return with an error", async () => {
      axiosStub.post = sinon.fake.throws(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(res.error).to.be.eql("Error");
    });
  });

  describe("tryHandleRedirectError", async function () {
    let req;
    let res;
    let next;
    let axiosStub = {};
    let configStub = {};
    let middleware;
    let ipvMiddlewareStub = {};

    const error = "access_denied";
    const error_description = "restart ";
    const id = "ukPassport";

    beforeEach(() => {
      configStub.API_BASE_URL = "https://example.net/path";
      ipvMiddlewareStub.handleJourneyResponse = sinon.fake();

      middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
        "../ipv/middleware": ipvMiddlewareStub,
      });

      req = {
        url: `/callback`,
        query: { error, error_description, id },
        params: {},
        session: { ipvSessionId: "ipv-session-id" },
      };

      res = {
        status: sinon.fake(),
        render: sinon.fake(),
        redirect: sinon.fake(),
      };
      next = sinon.fake();
    });

    it("should report error to journey api and redirect using response's journey value", async () => {
      const axiosResponse = {};

      axiosResponse.data = {
        journey: "journey/cri/error",
      };
      axiosStub.post = sinon.fake.returns(axiosResponse);

      const errorParams = new URLSearchParams([
        ["error", error],
        ["error_description", error_description],
        ["credential_issuer_id", "ukPassport"],
      ]);

      await middleware.tryHandleRedirectError(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/cri/error`,
        errorParams,
        sinon.match({
          headers: {
            "ipv-session-id": "ipv-session-id",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      expect(ipvMiddlewareStub.handleJourneyResponse.lastArg).to.equal(
        "journey/cri/error"
      );
    });

    it("should report error to journey api and redirect to journey value when only error description is present", async () => {
      const axiosResponse = {};

      axiosResponse.data = {
        journey: "journey/cri/error",
      };

      axiosStub.post = sinon.fake.returns(axiosResponse);

      const errorParams = new URLSearchParams([
        ["error", "undefined"],
        ["error_description", error_description],
        ["credential_issuer_id", "ukPassport"],
      ]);

      req = {
        url: `/callback`,
        query: { error_description, id },
        params: {},
        session: { ipvSessionId: "ipv-session-id" },
      };

      await middleware.tryHandleRedirectError(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/cri/error`,
        errorParams,
        sinon.match({
          headers: {
            "ipv-session-id": "ipv-session-id",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      expect(ipvMiddlewareStub.handleJourneyResponse.lastArg).to.equal(
        "journey/cri/error"
      );
    });

    it("should call next if no error and error_description is present in the query string", async () => {
      req = {
        url: `/callback`,
        query: {},
        session: { ipvSessionId: "ipv-session-id" },
      };
      axiosStub.post = sinon.fake.returns({});

      await middleware.tryHandleRedirectError(req, res, next);

      expect(next).to.have.been.calledOnce;
    });

    it("should call next with error if api call errors", async () => {
      let axiosResponse = {};
      axiosResponse.status = 404;
      const axiosError = new Error("api error");
      axiosError.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(axiosError);
      await middleware.tryHandleRedirectError(req, res, next);

      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "api error")
      );
      expect(next).to.have.been.calledOnce;
    });
  });
});
