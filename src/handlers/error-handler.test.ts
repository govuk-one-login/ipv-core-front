import { AxiosError, AxiosResponse } from "axios";
import { expect } from "chai";
import { NextFunction, Request, Response } from "express";
import proxyquire from "proxyquire";
import sinon from "sinon";
import pageNotFoundHandler from "./page-not-found-handler";
import serverErrorHandler from "./internal-server-error-handler";
import journeyEventErrorHandler from "./journey-event-error-handler";

describe("Error handlers", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

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
    } as any;

    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    } as any;

    next = sinon.fake() as any;
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
      (err as any).code = "EBADCSRFTOKEN";

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
    it("should render page with provided pageId", () => {
      const axiosResponse = {
        data: {
          page: "pyi-technical",
          statusCode: 400,
        },
      } as AxiosResponse;

      const err = new AxiosError("some error");
      err.response = axiosResponse;

      journeyEventErrorHandler(err, req, res, next);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk");
      expect(res.status).to.have.been.calledWith(400);
    });

    it("should call next with error when there is no pageId", () => {
      const axiosResponse = {
        data: {
          statusCode: 400,
        },
      } as AxiosResponse;

      const err = new AxiosError("some error");
      err.response = axiosResponse;
      journeyEventErrorHandler(err, req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should set client OAuth session id", () => {
      const axiosResponse = {
        data: {
          page: "pyi-timeout-recoverable",
          statusCode: 401,
          clientOAuthSessionId: "fake-session-id",
        },
      } as AxiosResponse;

      const err = new AxiosError("timeout recoverable error");
      err.response = axiosResponse;

      journeyEventErrorHandler(err, req, res, next);

      expect(req.session.clientOauthSessionId).to.eq("fake-session-id");
      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-timeout-recoverable.njk",
      );
      expect(res.status).to.have.been.calledWith(401);
    });

    it("should call next if headers sent", () => {
      res.headersSent = true;
      const err = new Error("some error");
      journeyEventErrorHandler(err, req, res, next);

      expect(next).to.be.have.been.calledOnce;
    });
  });
});
