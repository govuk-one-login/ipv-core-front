const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("cri Helper", () => {
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
              ipvClientId: "test-ipv-client",
            },
            {
              id: "FraudIssuer",
              name: "Fraud (Stub)",
              authorizeUrl: "http://fraud-stub-1/authorize",
              tokenUrl: "http://fraud-stub-1/token",
              credentialUrl: "http://fraud-stub-1/credential",
              ipvClientId: "test-ipv-client",
            },
            {
              id: "AddressIssuer",
              name: "Address (Stub)",
              authorizeUrl: "http://address-stub-1/authorize",
              tokenUrl: "http://address-stub-1/token",
              credentialUrl: "http://address-stub-1/credential",
              ipvClientId: "test-ipv-client",
            },
          ],
        },
        query: {
          id: "PassportIssuer",
        },
      };
      res = { send: sinon.fake(), status: sinon.fake() };
      next = sinon.fake();
      configStub = {};
    });

    it("should successfully return expected redirect url", async function () {
      configStub.EXTERNAL_WEBSITE_HOST = "https://example.org/subpath";
      const { buildCredentialIssuerRedirectURL } = proxyquire(
        "../shared/criHelper",
        {
          "../../lib/config": configStub,
        }
      );

      await buildCredentialIssuerRedirectURL(req, res, next);

      expect(req.redirectURL.toString()).to.equal(
        "http://passport-stub-1/authorize?client_id=test-ipv-client&request=undefined"
      );
    });

    context("with an empty base url", () => {
      it("should send 500 error", async () => {
        const { buildCredentialIssuerRedirectURL } = proxyquire(
          "../shared/criHelper",
          {
            "../../lib/config": configStub,
          }
        );
        req.query = {};

        await buildCredentialIssuerRedirectURL(req, res);

        expect(res.status).to.have.been.calledWith(500);
        expect(res.send).to.have.been.calledWith(
          "Could not find configured CRI"
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
      const { redirectToAuthorize } = proxyquire("../shared/criHelper", {
        "../../lib/config": configStub,
      });

      await redirectToAuthorize(req, res);

      expect(res.redirect).to.have.been.calledWith(req.redirectURL);
    });
  });
});
