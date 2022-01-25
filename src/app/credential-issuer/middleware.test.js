const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("credential issuer middleware", () => {
  describe("getJwt", () => {
    const axiosStub = {};
    let axiosResponse;


    const configStub = {
      API_ISSUED_JWT_PATH: "/issued-jwt",
      API_BASE_URL: "https://example.org/subpath",
    };
    
    const middleware = proxyquire("./middleware", {
      axios: axiosStub,
      "../../lib/config": configStub,
    });

    let req;
    let res;
    let next;
  
    beforeEach(() => {
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
        send: sinon.fake(),
        render: sinon.fake(),
      };
      req = {
        session: {}
      };
      next = sinon.fake();
      
      axiosResponse = {
        jwt: undefined
      };
  
      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    context("successfully gets issued jwt from core-back", () => {
      beforeEach(() => {
        axiosResponse.jwt = "test";
      });
      it("should set issued jwt on request in session", async function () {
        await middleware.getJwt(req, res, next);

        expect(req.session.jwt).to.eql(axiosResponse.jwt);
      });

      it("should call next", async function () {
        await middleware.getJwt(req, res, next);

        expect(next).to.have.been.called;
      });
    });

    context("with missing jwt", () => {
      beforeEach(() => {
        axiosStub.get = sinon.fake.returns(axiosResponse);
      });

      it("should send a 500 error when jwt is missing", async function () {
        await middleware.getJwt(req, res);

        expect(res.status).to.have.been.calledWith(500);
      });

      it("should not call next", async function () {
        await middleware.getJwt(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with axios error", () => {
      let errorMessage;

      beforeEach(() => {
        errorMessage = "server error";
        axiosStub.get = sinon.fake.throws(new Error(errorMessage));
      });

      it("should send call next with error when jwt is missing", async () => {
        await middleware.getJwt(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", errorMessage))
        );
      });
    });
  });

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
      req = {
        session: {
          criConfig: [
            {
              id: "PassportIssuer",
              name: "Passport (Stub)",
              authorizeUrl: "http://passport-stub-1/authorize",
              tokenUrl: "http://passport-stub-1/token",
              credentialUrl: "http://passport-stub-1/credential",
              ipvClientId: "test-ipv-client"
            },
            {
              id: "FraudIssuer",
              name: "Fraud (Stub)",
              authorizeUrl: "http://fraud-stub-1/authorize",
              tokenUrl: "http://fraud-stub-1/token",
              credentialUrl: "http://fraud-stub-1/credential",
              ipvClientId: "test-ipv-client"
            },
            {
              id: "AddressIssuer",
              name: "Address (Stub)",
              authorizeUrl: "http://address-stub-1/authorize",
              tokenUrl: "http://address-stub-1/token",
              credentialUrl: "http://address-stub-1/credential",
              ipvClientId: "test-ipv-client"
            }
          ]
        },
        query: {
          id: "PassportIssuer"
        }
      };
      res = { send: sinon.fake(), status: sinon.fake() };
      next = sinon.fake();
      configStub = {};
    });

    it("should successfully return expected redirect url", async function () {
      configStub.EXTERNAL_WEBSITE_HOST = "https://example.org/subpath";
      const { buildCredentialIssuerRedirectURL } = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await buildCredentialIssuerRedirectURL(req, res, next);

      expect(req.redirectURL.toString()).to.equal(
        "http://passport-stub-1/authorize?response_type=code&client_id=test-ipv-client&state=test-state&redirect_uri=https%3A%2F%2Fexample.org%2Fsubpath%2Fcredential-issuer%2Fcallback%3Fid%3DPassportIssuer&request=undefined"
      );
    });

    context("with an empty base url", () => {
      it("should send 500 error", async () => {
        const { buildCredentialIssuerRedirectURL } = proxyquire(
          "./middleware",
          {
            "../../lib/config": configStub,
          }
        );
        req.query = {};

        await buildCredentialIssuerRedirectURL(req, res);

        expect(res.status).to.have.been.calledWith(500);
        expect(res.send).to.have.been.calledWith("Could not find configured CRI");
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
    let middleware;

    beforeEach(() => {
      configStub.API_REQUEST_EVIDENCE_PATH = "/ADD-EVIDENCE";
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
          ["redirect_uri", `http://example.com/credential-issuer/callback`],
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

    it("should call next", async () => {
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(next).to.have.been.called;
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
});
