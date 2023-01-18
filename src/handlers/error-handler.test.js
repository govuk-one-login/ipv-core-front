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

describe("Error handlers", () => {
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

  afterEach(() => {
    sinon.restore();
  });

  describe("pageNotFoundHandler", () => {
    it("should render page-not-found view", () => {
      pageNotFoundHandler(req, res, next);

      expect(res.status).to.have.been.calledOnceWith(404);
      expect(res.render).to.have.been.calledOnceWith(
        "errors/page-not-found.njk"
      );
    });
  });

  describe("serverErrorHandler", () => {
    it("should render pyi-unrecoverable view when csrf token is invalid", () => {
      const err = new Error("invalid csrf token");
      err["code"] = "EBADCSRFTOKEN";

      serverErrorHandler(err, req, res, next);

      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.redirect).to.have.been.calledOnceWith(
        "/ipv/page/pyi-technical-unrecoverable"
      );
    });

    it("should render pyi-unrecoverable view when unexpected error", () => {
      const err = new Error("internal server error");

      serverErrorHandler(err, req, res, next);

      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.redirect).to.have.been.calledOnceWith(
        "/ipv/page/pyi-technical-unrecoverable"
      );
    });

    it("should render session-ended view when no session", () => {
      const err = new Error("timeout");
      res.statusCode = 401;

      serverErrorHandler(err, req, res, next);

      expect(res.render).to.have.been.calledOnceWith(
        "errors/session-ended.njk"
      );
    });
  });

  describe("journeyEventErrorHandler", () => {
    it("should render page with provided pageId", () => {
      let axiosResponse;
      let axiosStub = {};
      let axiosHelperStub = {};
      axiosHelperStub.getAxios = () => axiosStub;
      axiosResponse = {
        status: {},
      };
      axiosResponse.data = {
        page: "pyi-technical",
        statusCode: 400,
      };

      const err = new Error();
      err.response = axiosResponse;
      axiosStub.post = sinon.fake.throws(err);

      journeyEventErrorHandler(err, req, res, next);

      expect(res.redirect).to.have.been.calledOnceWith(
        "/ipv/page/pyi-technical"
      );
    });
  });
});
