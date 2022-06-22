const proxyquire = require("proxyquire");

const axiosStub = {};
const configStub = {
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
      session: {},
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
          request: "test request",
        },
        session: {
          ipvSessionId: "abadcafe",
        },
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

    context("with missing Request JWT", () => {
      beforeEach(() => {
        req.query.request = null;
      });

      it("should throw error", async function () {
        axiosStub.post = sinon.fake.throws(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Request JWT Missing"))
        );
      });
    });

    context("with Client ID missing", () => {
      beforeEach(() => {
        req.query.client_id = null;
      });

      it("should throw error", async function () {
        axiosStub.post = sinon.fake.throws(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);
        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Client ID Missing"))
        );
      });
    });
  });

  describe("redirectToJourney", () => {
    it("should redirect to journey route", () => {
      middleware.redirectToJourney(req, res);

      expect(res.redirect).to.have.been.calledWith("/ipv/journey/next");
    });
  });
});
