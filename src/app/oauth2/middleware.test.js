const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");

let axiosStub = {};

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
      log: { info: sinon.fake(), error: sinon.fake() },
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
        log: { info: sinon.fake(), error: sinon.fake() },
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
        expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
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

  describe("setIpAddress", () => {
    beforeEach(() => {
      req = {
        headers: {
          forwarded: "for=1.2.3.4;proto=https;by=4.3.2.1",
        },
        session: {
          ipAddress: "",
        },
      };
    });

    context("with forwarded", () => {
      it("should set ipAddress in session", async function () {
        await middleware.setIpAddress(req, res, next);

        expect(req.session.ipAddress).to.eq("1.2.3.4");
      });

      it("should call next", async function () {
        await middleware.setIpAddress(req, res, next);
        expect(next).to.have.been.called;
      });
    });

    context("with forwarded multiple", () => {
      beforeEach(() => {
        req.headers.forwarded = "for=1.2.3.4,1.2.3.4;proto=https;by=4.3.2.1,4.3.2.1";
      });

      it("should set first ipAddress in session", async function () {
        await middleware.setIpAddress(req, res, next);
        expect(req.session.ipAddress).to.eq("1.2.3.4");
      });

      it("should call next", async function () {
        await middleware.setIpAddress(req, res, next);
        expect(next).to.have.been.called;
      });
    });

    context("with missing forwarded", () => {
      beforeEach(() => {
        req.headers.forwarded = null;
      });

      it("should set ipAddress as 'unknown'", async function () {
        await middleware.setIpAddress(req, res, next);
        expect(req.session.ipAddress).to.eq("unknown");
      });
    });
  });
});
