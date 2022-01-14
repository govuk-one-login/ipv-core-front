const proxyquire = require("proxyquire");

const axiosStub = {};

const configStub = {
  API_REQUEST_CONFIG_PATH: "/request-config",
  API_BASE_URL: "https://example.org/subpath",
};

const middleware = proxyquire("./middleware", {
  axios: axiosStub,
  "../../lib/config": configStub,
});

describe("debug middleware", () => {
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

    next = sinon.fake();
  });

  describe("setCriConfig", () => {
    let axiosResponse;
    describe("without criConfig in current session", () => {
      beforeEach(() => {
        req = {
          session: {}
        };
        axiosResponse = {
          data: [
            {
              criId: "PassportIssuer",
              name: "Passport (Stub)",
              authorizeUrl: "http://passport-stub-1/authorize",
              tokenUrl: "http://passport-stub-1/token",
              credentialUrl: "http://passport-stub-1/credential",
              ipvClientId: "test-ipv-client"
            },
            {
              criId: "FraudIssuer",
              name: "Fraud (Stub)",
              authorizeUrl: "http://fraud-stub-1/authorize",
              tokenUrl: "http://fraud-stub-1/token",
              credentialUrl: "http://fraud-stub-1/credential",
              ipvClientId: "test-ipv-client"
            },
            {
              criId: "AddressIssuer",
              name: "Address (Stub)",
              authorizeUrl: "http://address-stub-1/authorize",
              tokenUrl: "http://address-stub-1/token",
              credentialUrl: "http://address-stub-1/credential",
              ipvClientId: "test-ipv-client"
            }
          ],
        };
      });

      context("successfully gets criConfig from core-back", () => {
        it("should set criConfig in session", async function () {
          axiosStub.get = sinon.fake.returns(axiosResponse);

          await middleware.setCriConfig(req, res, next);

          expect(req.session.criConfig).to.eq(axiosResponse.data);
        });

        it("should call next", async function () {
          await middleware.setCriConfig(req, res, next);

          expect(next).to.have.been.called;
        });
      });

      context("failed to get criConfig from core-back", () => {
        it("should throw error", async function () {
          axiosStub.get = sinon.fake.throws(axiosResponse);

          await middleware.setCriConfig(req, res, next);

          expect(res.error).to.be.eql("Error");
        });
      });
    });

    describe("with criConfig already in session", () => {
      beforeEach(() => {
        req = {
          session: {
            criConfig: [
              {
                criId: "PassportIssuer",
                name: "Passport (Stub)",
                authorizeUrl: "http://passport-stub-1/authorize",
                tokenUrl: "http://passport-stub-1/token",
                credentialUrl: "http://passport-stub-1/credential",
                ipvClientId: "test-ipv-client"
              }
            ]
          }
        }
      });

      it("request-config endpoint has not been called", async function () {
        axiosStub.get = sinon.stub();

        await middleware.setCriConfig(req, res, next);

        expect(axiosStub.get).to.not.have.been.called;
      })
    });
  });

  describe("renderDebugPage", () => {
    it("should render debug page", () => {
      middleware.renderDebugPage(req, res);

      expect(res.render).to.have.been.calledWith("debug/debug");
    });
  });
});
