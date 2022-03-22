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

    beforeEach(() => {
      configStub.API_CRI_RETURN_PATH = "/ADD-EVIDENCE";
      configStub.API_BASE_URL = "https://example.net/path";
      configStub.CREDENTIAL_ISSUER_ID = "testCredentialIssuerId";
      configStub.EXTERNAL_WEBSITE_HOST = "http://example.com";

      middleware = proxyquire("./middleware", {
        axios: axiosStub,
        "../../lib/config": configStub,
      });
      req = {
        credentialIssuer: { code: "authorize-code-issued" },
        session: { ipvSessionId: "ipv-session-id" },
        query: { id: "PassportIssuer" }
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
          ["redirect_uri", `http://example.com/credential-issuer/callback?id=${req.query.id}`],
        ]);

        await middleware.sendParamsToAPI(req, res, next);

        expect(axiosStub.post).to.have.been.calledWith(
          "https://example.net/path/ADD-EVIDENCE",
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
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.eql(200);
    });

    it("should call /journey/next", async () => {
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.redirect).to.have.been.calledWith("/journey/next");
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
  describe("tryHandleRedirectError", async function () {
    let req;
    let res;
    let next;
    let axiosStub = {};
    let configStub = {};
    let middleware;

    const error = 'access_denied';
    const error_description = 'restart '

    beforeEach(() => {
      configStub.API_BASE_URL = "https://example.net/path";

      middleware = proxyquire("./middleware", {
       axios: axiosStub,
        "../../lib/config": configStub,
      });

      req = {
        url: `/callback`,
        query: {error, error_description},
        session: { ipvSessionId: "ipv-session-id" },
      };

      res = {
        status: sinon.fake(),
        render: sinon.fake()
      };
      next = sinon.fake();
    });

    it("should report error to journey api and render cri error template", async () => {

      const errorParams = new URLSearchParams([
        ["error", error],
        ["error_description", error_description],
      ]);

      axiosStub.post = sinon.fake.returns({});
      await middleware.tryHandleRedirectError(req, res, next);

      expect(axiosStub.post).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/event/cri/error`,
        errorParams,
        sinon.match({
          headers: {
            "ipv-session-id": "ipv-session-id",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }));

      expect(res.render).to.have.been.calledWith('errors/credential-issuer', {error, error_description})
    })

  });
});
