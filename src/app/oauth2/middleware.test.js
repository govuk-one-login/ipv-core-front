const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");

let CoreBackServiceStub = {};

const configStub = {
  API_BASE_URL: "https://example.org/subpath",
};

const ipvMiddleware = proxyquire("../ipv/middleware", {
  "../../services/coreBackService": CoreBackServiceStub,
  "../../lib/config": configStub,
});

const middleware = proxyquire("./middleware", {
  "../../services/coreBackService": CoreBackServiceStub,
  "../../lib/config": configStub,
  "../ipv/middleware": ipvMiddleware,
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

  describe("setIpvSessionId", () => {
    let axiosResponse;

    beforeEach(() => {
      req = {
        log: { info: sinon.fake(), error: sinon.fake() },
        body: { journey: "journey/next" },
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

    context("with handleOAuthJourneyAction", () => {
      it("should pass next journey event when handling OAuth Call", async function () {
        CoreBackServiceStub.postJourneyEvent = sinon.fake();

        await middleware.handleOAuthJourneyAction(req, res, next);

        expect(CoreBackServiceStub.postJourneyEvent).to.have.been.called;
      });
    });

    it("should pass next journey event by default when handling OAuth Call", async function () {
      CoreBackServiceStub.postJourneyEvent = sinon.fake();
      req.body.journey = "journey/nonsense";

      await middleware.handleOAuthJourneyAction(req, res, next);

      expect(CoreBackServiceStub.postJourneyEvent).to.have.been.called;
    });

    it("should throw error when handling OAuth Call if missing ipvSessionId", async function () {
      CoreBackServiceStub.postJourneyEvent = sinon.fake();
      req.session.ipvSessionId = undefined;

      await middleware.handleOAuthJourneyAction(req, res, next);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    context("with ipvSessionId", () => {
      beforeEach(() => {
        axiosResponse.data.ipvSessionId = "abadcafe";
      });

      it("should set ipvSessionId in session", async function () {
        CoreBackServiceStub.postSessionInitialise =
          sinon.fake.returns(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);
        expect(req.session.ipvSessionId).to.eq(axiosResponse.data.ipvSessionId);
      });

      it("should call next", async function () {
        await middleware.setIpvSessionId(req, res, next);
        expect(next).to.have.been.called;
      });
    });

    context("with missing ipvSessionId", () => {
      beforeEach(() => {
        axiosResponse.data.ipvSessionId = null;
      });

      it("should set ipvSessionId as null in session", async function () {
        CoreBackServiceStub.postSessionInitialise =
          sinon.fake.returns(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);
        expect(req.session.ipvSessionId).to.eq(null);
      });

      it("should call next", async function () {
        await middleware.setIpvSessionId(req, res, next);
        expect(next).to.have.been.called;
      });
    });

    context("with missing Request JWT", () => {
      beforeEach(() => {
        req.query.request = null;
      });

      it("should throw error", async function () {
        CoreBackServiceStub.postSessionInitialise =
          sinon.fake.throws(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Request JWT Missing")),
        );
      });
    });

    context("with Client ID missing", () => {
      beforeEach(() => {
        req.query.client_id = null;
      });

      it("should throw error", async function () {
        CoreBackServiceStub.postSessionInitialise =
          sinon.fake.throws(axiosResponse);
        await middleware.setIpvSessionId(req, res, next);
        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Client ID Missing")),
        );
      });
    });
  });
});
