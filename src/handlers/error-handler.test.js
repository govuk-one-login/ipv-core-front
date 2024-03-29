const { expect } = require("chai");
const sinon = require("sinon");
const {
  pageNotFoundHandler,
} = require("../../src/handlers/page-not-found-handler");
const {
  serverErrorHandler,
} = require("../../src/handlers/internal-server-error-handler");
const {
  journeyEventErrorHandler,
} = require("../../src/handlers/journey-event-error-handler");
const proxyquire = require("proxyquire");

describe("Error handlers", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    proxyquire("./internal-server-error-handler", {
      axios: {
        isAxiosError: sinon.stub().returns(false),
      },
    });

    req = {
      session: {},
      log: { info: sinon.fake(), error: sinon.fake() },
      csrfToken: sinon.fake(),
    };

    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    };

    next = sinon.fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("pageNotFoundHandler", () => {
    it("should render page-not-found view", () => {
      pageNotFoundHandler(req, res, next);

      expect(res.status).to.have.been.calledOnceWith(404);
      expect(res.render).to.have.been.calledOnceWith(
        "errors/page-not-found.njk",
      );
    });

    it("should call next if headers sent", () => {
      res.headersSent = true;
      pageNotFoundHandler(req, res, next);

      expect(next).to.be.have.been.calledOnce;
    });
  });

  describe("serverErrorHandler", () => {
    it("should render pyi-unrecoverable view when csrf token is invalid", () => {
      const err = new Error("invalid csrf token");
      err["code"] = "EBADCSRFTOKEN";

      serverErrorHandler(err, req, res, next);

      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render pyi-unrecoverable view when unexpected error", () => {
      const err = new Error("internal server error");

      serverErrorHandler(err, req, res, next);

      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render session-ended view when no session", () => {
      const err = new Error("timeout");
      res.statusCode = 401;

      serverErrorHandler(err, req, res, next);

      expect(res.render).to.have.been.calledOnceWith(
        "errors/session-ended.njk",
      );
    });

    it("should call next if headers sent", () => {
      res.headersSent = true;
      const err = new Error("some error");
      serverErrorHandler(err, req, res, next);

      expect(next).to.be.have.been.calledOnce;
    });

    it("should log the error if not an axios error", () => {
      const err = new Error("some error");
      serverErrorHandler(err, req, res, next);

      expect(req.log.error).to.be.have.been.calledOnce;
    });
  });

  describe("journeyEventErrorHandler", () => {
    let axiosResponse;
    let axiosStub = {};
    axiosResponse = {
      status: {},
    };

    it("should render page with provided pageId", () => {
      axiosResponse.data = {
        page: "pyi-technical",
        statusCode: 400,
      };

      const err = new Error("some error");
      err.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(err);

      journeyEventErrorHandler(err, req, res, next);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk");
    });

    it("should call next with error when there is no pageId", () => {
      axiosResponse.data = {
        statusCode: 400,
      };

      const err = new Error("some error");
      err.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(err);
      journeyEventErrorHandler(err, req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should render pyi-timeout-recoverable page", () => {
      axiosResponse.data = {
        page: "pyi-timeout-recoverable",
        statusCode: 401,
        clientOAuthSessionId: "fake-session-id",
      };
      res.statusCode = 401;
      const err = new Error("timeout recoverable error");
      err.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(err);
      journeyEventErrorHandler(err, req, res, next);
      expect(req.session.clientOauthSessionId).to.eq("fake-session-id");

      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-timeout-recoverable.njk",
      );
    });

    it("should call next if headers sent", () => {
      res.headersSent = true;
      const err = new Error("some error");
      journeyEventErrorHandler(err, req, res, next);

      expect(next).to.be.have.been.calledOnce;
    });
  });
});
