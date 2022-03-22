const proxyquire = require("proxyquire");

const axiosStub = {};
const configStub = {
  AUTH_PATH: "/subsubpath/auth",
  API_BASE_URL: "https://example.org/subpath",
};
const middleware = proxyquire("./middleware", {
  axios: axiosStub,
  "../../lib/config": configStub,
});

describe("oauth middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      session: {}
    };

    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    };

    next = sinon.fake();
  });

  describe("setDebugJourneyType", () => {
    it("should set isDebugJourney to true in session", () => {
      middleware.setDebugJourneyType(req, res, next);

      expect(req.session.isDebugJourney).to.eq(true);
    });
  });

  describe("setRealJourneyType", () => {
    it("should set isDebugJourney to false in session", () => {
      middleware.setRealJourneyType(req, res, next);

      expect(req.session.isDebugJourney).to.eq(false);
    });
  });

  describe("setIpvSessionId", () => {
    let axiosResponse;

    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: "s6BhdRkqt3",
          state: "xyz",
          redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          unusedParam: "not used",
        },
        session: {
          ipvSessionId: {},
        }
      };
      axiosResponse = {
        data: {
          ipvSessionId: {},
        },
      };
    });

    context("with ipvSessionId", () => {
      beforeEach(() => {
        axiosResponse.data.ipvSessionId = "abadcafe";
      });

      it("should set ipvSessionId in session", async function () {
        axiosStub.post = sinon.fake.returns(axiosResponse);

        await middleware.setIpvSessionId(req, res, next);

        expect(req.session.ipvSessionId).to.eq(axiosResponse.data.ipvSessionId);
      });

      it("should call next", async function () {
        await middleware.setIpvSessionId(req, res, next);

        expect(next).to.have.been.called;
      });
    });

    context("with missing ipvSessionId", () => {
      it("should throw error", async function () {
        axiosStub.post = sinon.fake.throws(axiosResponse);

        await middleware.setIpvSessionId(req, res, next);

        expect(res.error).to.be.eql("Error");
      });
    });

  });

  describe("renderOauthPage", () => {
    it("should render index page", () => {
      middleware.renderOauthPage(req, res);

      expect(res.render).to.have.been.calledWith("index-hmpo");
    });
  });

  describe("redirectToDebugPage", () => {
    it("should redirect to debug page", () => {
      middleware.redirectToDebugPage(req, res);

      expect(res.redirect).to.have.been.calledWith("/debug");
    });
  });

  describe("redirectToJourney", () => {
    it("should redirect to journey route", () => {
      middleware.redirectToJourney(req, res);

      expect(res.redirect).to.have.been.calledWith("/journey/journey/next");
    });
  });

  describe("retrieveAuthorizationCode", () => {
    let axiosResponse;

    beforeEach(() => {
      req = {
        session: {
          authParams: {
            response_type: "code",
            client_id: "s6BhdRkqt3",
            state: "xyz",
            redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
            scope: "openid",
          },
        },
      };

      axiosResponse = {
        data: {
          code: {},
        },
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    context("auth request", () => {
      it("should call axios with correct parameters", async () => {
        req.session.ipvSessionId = "abadcafe";

        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(axiosStub.get).to.have.been.calledWith(
          "https://example.org/subpath/subsubpath/auth",
          sinon.match({
            params: { ...req.session.authParams },
            headers: { "ipv-session-id": "abadcafe" },
          })
        );
      });
    });

    context("with authorization code", () => {
      beforeEach(() => {
        axiosResponse.data.code.value = "12345";
      });

      it("should set authorization_code on req", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(req.authorization_code).to.eq(axiosResponse.data.code.value);
      });
      it("should call next", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.called;
      });
    });

    context("with missing authorization code", () => {
      beforeEach(() => {
        axiosStub.get = sinon.fake.returns(axiosResponse);
      });

      it("should send a 500 error when code is missing", async function () {
        await middleware.retrieveAuthorizationCode(req, res);

        expect(res.status).to.have.been.calledWith(500);
      });

      it("should not call next", async function () {
        await middleware.retrieveAuthorizationCode(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with axios error", () => {
      let errorMessage;

      beforeEach(() => {
        errorMessage = "server error";
        axiosStub.get = sinon.fake.throws(new Error(errorMessage));
      });

      it("should send call next with error when code is missing", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", errorMessage))
        );
      });
    });
  });

  describe("redirectToCallback", () => {
    let axiosResponse;

    beforeEach(() => {
      req = {
        session: {
          authParams: {
            redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          },
        },
        authorization_code: "1234",
      };

      axiosResponse = {
        data: {
          code: {},
        },
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    it("should successfully redirects when code is valid", async function () {
      await middleware.redirectToCallback(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb?code=1234`
      );
    });
  });
});
